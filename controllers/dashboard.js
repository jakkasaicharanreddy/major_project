const Booking = require("../models/booking");
const Listing = require("../models/listing");

module.exports.dashboard = async (req, res) => {
    const userId = req.user._id;

    // Renter: current user's bookings with listing details
    const myBookings = await Booking.find({ user: userId })
        .populate("listing")
        .sort({ createdAt: -1 });

    // Host: current user's owned listings
    const myListings = await Listing.find({ owner: userId });

    // Host: booking requests for the user's listings
    const listingIds = myListings.map((ownedListing) => ownedListing._id);

    let bookingRequests = [];
    if (listingIds.length > 0) {
        bookingRequests = await Booking.find({ listing: { $in: listingIds } })
            .populate("listing")
            .populate("user")
            .sort({ createdAt: -1 });
    }

    const pendingRequests = bookingRequests.filter((booking) => booking.status === "pending");

    const pendingCountByListing = {};
    for (const request of pendingRequests) {
        const listingId = request.listing ? request.listing._id.toString() : null;
        if (listingId) {
            pendingCountByListing[listingId] = (pendingCountByListing[listingId] || 0) + 1;
        }
    }

    res.render("dashboard/index", {
        myBookings,
        myListings,
        pendingRequests,
        pendingRequestsCount: pendingRequests.length,
        totalBookings: myBookings.length,
        pendingBookings: myBookings.filter((booking) => booking.status === "pending").length,
        confirmedBookings: myBookings.filter((booking) => booking.status === "confirmed").length,
        totalListings: myListings.length,
        pendingCountByListing,
        pageTitle: "My Dashboard"
    });
};