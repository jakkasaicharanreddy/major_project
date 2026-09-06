const Booking = require("../models/booking");
const Listing = require("../models/listing");

async function loadOwnerBooking(req, res) {
    const booking = await Booking.findById(req.params.bookingId)
        .populate("listing")
        .populate("user");

    if (!booking) {
        req.flash("error", "Booking not found");
        res.redirect("/bookings/requests");
        return null;
    }

    if (!booking.listing) {
        req.flash("error", "Listing not found for this booking");
        res.redirect("/bookings/requests");
        return null;
    }

    if (!booking.listing.owner || !booking.listing.owner.equals(req.user._id)) {
        req.flash("error", "You are not allowed to do this action");
        res.redirect("/bookings/requests");
        return null;
    }

    return booking;
}

module.exports.viewOwnerRequests = async (req, res) => {
    try {
        const ownedListings = await Listing.find({ owner: req.user._id }).select("_id");
        const listingIds = ownedListings.map((ownedListing) => ownedListing._id);

        const bookings = await Booking.find({ listing: { $in: listingIds } })
            .populate("listing")
            .populate("user")
            .sort({ createdAt: -1 });

        res.render("bookings/requests", {
            bookings,
            pageTitle: "Booking Requests"
        });
    } catch (err) {
        console.error("Error fetching booking requests:", err);
        req.flash("error", "Error loading booking requests");
        res.redirect("/listings");
    }
};

module.exports.acceptBooking = async (req, res) => {
    try {
        const booking = await loadOwnerBooking(req, res);
        if (!booking) return;

        if (booking.status === "confirmed") {
            req.flash("error", "This booking is already confirmed");
            return res.redirect("/bookings/requests");
        }

        if (booking.status !== "pending") {
            req.flash("error", "Only pending bookings can be accepted");
            return res.redirect("/bookings/requests");
        }

        const overlappingBooking = await Booking.findOne({
            _id: { $ne: booking._id },
            listing: booking.listing._id,
            status: { $ne: "cancelled" },
            checkIn: { $lt: booking.checkOut },
            checkOut: { $gt: booking.checkIn }
        });

        if (overlappingBooking) {
            req.flash("error", "Those dates are no longer available for this listing");
            return res.redirect("/bookings/requests");
        }

        booking.status = "confirmed";
        await booking.save();
        req.flash("success", "Booking confirmed");
        res.redirect("/bookings/requests");
    } catch (err) {
        console.error("Error accepting booking:", err);
        req.flash("error", "Failed to accept booking");
        res.redirect("/bookings/requests");
    }
};

module.exports.rejectBooking = async (req, res) => {
    try {
        const booking = await loadOwnerBooking(req, res);
        if (!booking) return;

        if (booking.status === "cancelled") {
            req.flash("error", "This booking is already cancelled");
            return res.redirect("/bookings/requests");
        }

        if (booking.status !== "pending") {
            req.flash("error", "Only pending bookings can be rejected");
            return res.redirect("/bookings/requests");
        }

        booking.status = "cancelled";
        await booking.save();
        req.flash("success", "Booking rejected");
        res.redirect("/bookings/requests");
    } catch (err) {
        console.error("Error rejecting booking:", err);
        req.flash("error", "Failed to reject booking");
        res.redirect("/bookings/requests");
    }
};

module.exports.cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.bookingId);

        if (!booking) {
            req.flash("error", "Booking not found");
            return res.redirect("/bookings");
        }

        if (!booking.user.equals(req.user._id)) {
            req.flash("error", "You are not allowed to cancel this booking");
            return res.redirect("/bookings");
        }

        if (booking.status === "confirmed") {
            req.flash("error", "Confirmed bookings cannot be cancelled");
            return res.redirect("/bookings");
        }

        if (booking.status === "cancelled") {
            req.flash("error", "This booking is already cancelled");
            return res.redirect("/bookings");
        }

        if (booking.status !== "pending") {
            req.flash("error", "Only pending bookings can be cancelled");
            return res.redirect("/bookings");
        }

        booking.status = "cancelled";
        await booking.save();
        req.flash("success", "Booking cancelled");
        res.redirect("/bookings");
    } catch (err) {
        console.error("Error cancelling booking:", err);
        req.flash("error", "Failed to cancel booking");
        res.redirect("/bookings");
    }
};
