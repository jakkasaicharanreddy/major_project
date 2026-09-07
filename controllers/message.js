const mongoose = require("mongoose");
const Message = require("../models/message.js");
const Listing = require("../models/listing.js");
const Booking = require("../models/booking.js");
const Notification = require("../models/notification.js");
const User = require("../models/user.js");

// ---- Step 12: Host <-> Renter messaging (HTTP + MongoDB, no WebSockets) ----

const MESSAGE_MAX_LENGTH = 1000;

function isValidObjectId(value) {
    return mongoose.Types.ObjectId.isValid(value);
}

// Validate + trim message content. Returns { ok, content?, error? }
function validateContent(raw) {
    if (typeof raw !== "string") {
        return { ok: false, error: "Message cannot be empty" };
    }
    const content = raw.trim();
    if (!content) {
        return { ok: false, error: "Message cannot be empty" };
    }
    if (content.length > MESSAGE_MAX_LENGTH) {
        return { ok: false, error: `Message cannot exceed ${MESSAGE_MAX_LENGTH} characters` };
    }
    return { ok: true, content };
}

// Validate an optional booking context supplied by the browser.
// Returns { ok, bookingId } — bookingId is null when no booking is given.
// The booking must belong to the supplied listing AND the current user must be
// the booking renter or the listing owner.
async function validateBookingContext(rawBookingId, listing, currentUser) {
    if (rawBookingId === undefined || rawBookingId === null || rawBookingId === "") {
        return { ok: true, bookingId: null };
    }
    if (typeof rawBookingId !== "string" || !isValidObjectId(rawBookingId)) {
        return { ok: false, bookingId: null };
    }
    try {
        const booking = await Booking.findById(rawBookingId);
        if (!booking) return { ok: false, bookingId: null };
        if (!booking.listing.equals(listing._id)) return { ok: false, bookingId: null };
        const isRenter = booking.user && booking.user.equals(currentUser._id);
        const isOwner = listing.owner && listing.owner.equals(currentUser._id);
        if (!isRenter && !isOwner) return { ok: false, bookingId: null };
        return { ok: true, bookingId: booking._id };
    } catch (e) {
        return { ok: false, bookingId: null };
    }
}

// GET /messages — inbox: conversations derived from messages (two users + one listing)
module.exports.index = async (req, res) => {
    try {
        const userId = req.user._id;

        const messages = await Message.find({ $or: [{ sender: userId }, { recipient: userId }] })
            .populate("listing", "title location")
            .populate("sender", "username displayName profileImage")
            .populate("recipient", "username displayName profileImage")
            .sort({ createdAt: -1 })
            .lean();

        // Derive one conversation per (listing, other participant).
        // Messages are newest-first, so the first hit per key is the latest message.
        const conversationsByKey = {};
        for (const msg of messages) {
            if (!msg.listing) continue; // listing was deleted
            const otherUser = msg.sender && msg.sender._id.equals(userId) ? msg.recipient : msg.sender;
            if (!otherUser || !otherUser._id) continue;
            const key = `${msg.listing._id.toString()}:${otherUser._id.toString()}`;

            const isUnreadForMe = !msg.isRead && msg.recipient && msg.recipient._id.equals(userId);

            if (!conversationsByKey[key]) {
                conversationsByKey[key] = {
                    listing: msg.listing,
                    otherUser,
                    latestMessage: msg,
                    unreadCount: isUnreadForMe ? 1 : 0
                };
            } else if (isUnreadForMe) {
                conversationsByKey[key].unreadCount += 1;
            }
        }

        const conversations = Object.values(conversationsByKey);

        res.render("messages/index", {
            conversations,
            pageTitle: "Messages"
        });
    } catch (err) {
        console.error("Error loading messages inbox:", err);
        req.flash("error", "Error loading messages");
        res.redirect("/dashboard");
    }
};

// Verify that a user genuinely participates in a listing's messaging context:
// either prior messages with the current user on this listing, or a booking on
// this listing. Used to validate host-supplied conversation partners securely.
async function hasListingContext(listing, currentUserId, otherUserId) {
    const priorMessage = await Message.findOne({
        listing: listing._id,
        $or: [
            { sender: currentUserId, recipient: otherUserId },
            { sender: otherUserId, recipient: currentUserId }
        ]
    });
    if (priorMessage) return true;
    const renterBooking = await Booking.findOne({ listing: listing._id, user: otherUserId });
    return !!renterBooking;
}

// GET /messages/:listingId — conversation between the current user and the listing's
// owner. Only messages where the current user is sender or recipient are returned,
// so no user can ever read a conversation between two other users.
// Hosts may pass ?with=<renterId> to open a specific renter thread; the partner is
// verified against real message/booking participation before use.
module.exports.showConversation = async (req, res) => {
    try {
        const { listingId } = req.params;
        if (!isValidObjectId(listingId)) {
            req.flash("error", "Invalid listing");
            return res.redirect("/messages");
        }

        const listing = await Listing.findById(listingId).populate("owner", "username displayName profileImage");
        if (!listing) {
            req.flash("error", "Listing not found");
            return res.redirect("/messages");
        }

        const userId = req.user._id;
        const isOwner = listing.owner && listing.owner._id.equals(userId);

        let otherUser = null;
        let threadFilter = {
            listing: listing._id,
            $or: [{ sender: userId }, { recipient: userId }]
        };
        let readFilter = { listing: listing._id, recipient: userId, isRead: false };

        if (!isOwner) {
            // Renter: the partner is ALWAYS the listing owner — never browser-supplied
            otherUser = listing.owner;
        } else {
            // Host: optionally open a specific renter thread via ?with=<renterId>
            const withParam = typeof req.query.with === "string" ? req.query.with.trim() : "";
            if (withParam) {
                if (!isValidObjectId(withParam) || withParam === userId.toString()) {
                    req.flash("error", "Invalid conversation");
                    return res.redirect("/messages");
                }
                // Verify the renter genuinely participates in this listing's context
                const allowed = await hasListingContext(listing, userId, withParam);
                if (!allowed) {
                    req.flash("error", "You are not allowed to open this conversation");
                    return res.redirect("/messages");
                }
                otherUser = await User.findById(withParam).select("username displayName profileImage");
                if (!otherUser) {
                    req.flash("error", "User not found");
                    return res.redirect("/messages");
                }
                threadFilter = {
                    listing: listing._id,
                    $or: [
                        { sender: userId, recipient: otherUser._id },
                        { sender: otherUser._id, recipient: userId }
                    ]
                };
                readFilter = { listing: listing._id, sender: otherUser._id, recipient: userId, isRead: false };
            }
            // Without ?with=, a host sees all messages on the listing involving them
            // (read-only view; replies happen from a specific thread).
        }

        // Retrieve messages strictly scoped: this listing AND current user is sender or recipient
        const messages = await Message.find(threadFilter)
            .populate("sender", "username displayName profileImage")
            .populate("recipient", "username displayName profileImage")
            .sort({ createdAt: 1 })
            .lean();

        // Mark messages the current user RECEIVED in this thread as read
        await Message.updateMany(readFilter, { $set: { isRead: true } });

        res.render("messages/conversation", {
            listing,
            otherUser,
            messages,
            userId: userId.toString(),
            isOwner,
            pageTitle: "Conversation"
        });
    } catch (err) {
        console.error("Error loading conversation:", err);
        req.flash("error", "Error loading conversation");
        res.redirect("/messages");
    }
};

// POST /messages/:listingId — send a message about a listing.
// The recipient is ALWAYS derived from the listing owner (or a verified booking
// context) — hidden form fields are never trusted for authorization.
module.exports.sendMessage = async (req, res) => {
    const { listingId } = req.params;
    try {
        if (!isValidObjectId(listingId)) {
            req.flash("error", "Invalid listing");
            return res.redirect("/messages");
        }

        const listing = await Listing.findById(listingId);
        if (!listing) {
            req.flash("error", "Listing not found");
            return res.redirect("/messages");
        }

        const userId = req.user._id;
        const isOwner = listing.owner && listing.owner.equals(userId);

        let recipientId;
        if (!isOwner) {
            // Renter -> host: recipient derived securely from the listing owner
            recipientId = listing.owner;
        } else {
            // Host reply: the renter partner must be verified against real
            // message/booking participation — hidden fields are never trusted.
            const withParam = typeof (req.body && req.body.with) === "string" ? req.body.with.trim() : "";
            if (!withParam || !isValidObjectId(withParam) || withParam === userId.toString()) {
                req.flash("error", "Open a specific conversation from your inbox to reply");
                return res.redirect("/messages");
            }
            const allowed = await hasListingContext(listing, userId, withParam);
            if (!allowed) {
                req.flash("error", "You are not allowed to message this user about this listing");
                return res.redirect("/messages");
            }
            recipientId = withParam;
        }

        // Prevent self-messaging
        if (!recipientId || recipientId.equals(userId)) {
            req.flash("error", "You cannot message yourself on your own listing");
            return res.redirect(`/listings/${listingId}`);
        }

        // Validate content (trim + length + non-empty)
        const validation = validateContent(req.body && req.body.content);
        if (!validation.ok) {
            req.flash("error", validation.error);
            return res.redirect(`/messages/${listingId}`);
        }

        // Optional verified booking context
        const bookingCheck = await validateBookingContext(req.body && req.body.bookingId, listing, req.user);
        if (!bookingCheck.ok) {
            req.flash("error", "Invalid booking reference");
            return res.redirect(`/messages/${listingId}`);
        }

        const message = new Message({
            sender: userId,
            recipient: recipientId,
            listing: listing._id,
            booking: bookingCheck.bookingId,
            content: validation.content
        });

        await message.save();

        // Persistent notification for the recipient.
        // A notification failure must NEVER undo a successfully saved message.
        try {
            const senderName = req.user.displayName || req.user.username;
            const notification = new Notification({
                recipient: recipientId,
                type: "new_message",
                message: `${senderName} sent you a message about ${listing.title}.`,
                listing: listing._id,
                booking: bookingCheck.bookingId
            });
            await notification.save();
        } catch (notifErr) {
            console.error("Error creating message notification:", notifErr);
        }

        req.flash("success", "Message sent");
        return res.redirect(isOwner ? `/messages/${listingId}?with=${recipientId}` : `/messages/${listingId}`);
    } catch (err) {
        console.error("Error sending message:", err);
        req.flash("error", "Failed to send message");
        return res.redirect(isValidObjectId(listingId) ? `/messages/${listingId}` : "/messages");
    }
};
