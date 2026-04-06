const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const Booking = require("../models/booking");
const Listing = require("../models/listing");
const { isLoggedin } = require("../midlewares");

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

        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
        const totalPrice = nights * listing.price;

        const booking = new Booking({
            listing: listingId,
            user: req.user._id,
            checkIn: checkInDate,
            checkOut: checkOutDate,
            guests: parseInt(guests) || 1,
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