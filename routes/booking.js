const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const Booking = require("../models/booking");
const Listing = require("../models/listing");
const { isLoggedin } = require("../midlewares");
const bookingController = require("../controllers/booking");

// View user's bookings - MUST come first
router.get("/", isLoggedin, wrapAsync(async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user._id }).populate("listing");
        res.render("bookings/index", { bookings, pageTitle: "My Bookings" });
    } catch (err) {
        console.error("Error fetching bookings:", err);
        req.flash("error", "Error loading bookings");
        res.redirect("/listings");
    }
}));

router.get("/requests", isLoggedin, wrapAsync(bookingController.viewOwnerRequests));
router.post("/:bookingId/accept", isLoggedin, wrapAsync(bookingController.acceptBooking));
router.post("/:bookingId/reject", isLoggedin, wrapAsync(bookingController.rejectBooking));

function parseLocalDate(value) {
    if (!value) return null;

    if (typeof value === "string") {
        const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
        if (match) {
            const year = Number(match[1]);
            const month = Number(match[2]) - 1;
            const day = Number(match[3]);
            const parsed = new Date(year, month, day);
            if (
                parsed.getFullYear() !== year ||
                parsed.getMonth() !== month ||
                parsed.getDate() !== day
            ) {
                return null;
            }
            return parsed;
        }
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    parsed.setHours(0, 0, 0, 0);
    return parsed;
}

function startOfToday() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
}

// Create booking
router.post("/:listingId", isLoggedin, wrapAsync(async (req, res) => {
    try {
        const { listingId } = req.params;
        const { checkIn, checkOut, guests } = req.body;

        console.log("Creating booking for listing:", listingId);

        const listing = await Listing.findById(listingId);
        if (!listing) {
            req.flash("error", "Listing not found!");
            return res.redirect("/listings");
        }

        if (listing.owner && listing.owner.equals(req.user._id)) {
            req.flash("error", "You cannot book your own listing");
            return res.redirect(`/listings/${listingId}`);
        }

        const checkInDate = parseLocalDate(checkIn);
        const checkOutDate = parseLocalDate(checkOut);

        if (!checkInDate || !checkOutDate) {
            req.flash("error", "Please provide valid check-in and check-out dates");
            return res.redirect(`/listings/${listingId}`);
        }

        if (checkInDate < startOfToday()) {
            req.flash("error", "Check-in date cannot be in the past");
            return res.redirect(`/listings/${listingId}`);
        }

        if (checkOutDate <= checkInDate) {
            req.flash("error", "Check-out must be after check-in");
            return res.redirect(`/listings/${listingId}`);
        }

        const guestCount = Number(guests);
        if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > 4) {
            req.flash("error", "Guests must be a whole number between 1 and 4");
            return res.redirect(`/listings/${listingId}`);
        }

        const overlappingBooking = await Booking.findOne({
            listing: listingId,
            status: { $ne: "cancelled" },
            checkIn: { $lt: checkOutDate },
            checkOut: { $gt: checkInDate }
        });

        if (overlappingBooking) {
            req.flash("error", "Those dates are not available for this listing");
            return res.redirect(`/listings/${listingId}`);
        }

        const nights = Math.round((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
        const totalPrice = nights * listing.price;

        const booking = new Booking({
            listing: listingId,
            user: req.user._id,
            checkIn: checkInDate,
            checkOut: checkOutDate,
            guests: guestCount,
            totalPrice
        });

        await booking.save();
        console.log("Booking created successfully");
        req.flash("success", "Booking request sent!");
        res.redirect(`/listings/${listingId}`);
    } catch (err) {
        console.error("Error creating booking:", err);
        req.flash("error", "Failed to create booking");
        res.redirect("/listings");
    }
}));

module.exports = router;