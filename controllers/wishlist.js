const Wishlist = require("../models/wishlist");

module.exports.viewWishlist = async (req, res) => {
    try {
        const userId = req.user._id;
        
        const wishlist = await Wishlist.findOne({ user: userId }).populate("listings");
        
        res.render("wishlist/index", { 
            wishlist: wishlist || { listings: [] },
            pageTitle: "My Wishlist"
        });
    } catch (err) {
        console.error("Error fetching wishlist:", err);
        req.flash("error", "Error loading wishlist");
        res.redirect("/listings");
    }
};

module.exports.addToWishlist = async (req, res) => {
    try {
        const { listingId } = req.params;
        const userId = req.user._id;
        

        let wishlist = await Wishlist.findOne({ user: userId });
        if (!wishlist) {
            wishlist = new Wishlist({ user: userId, listings: [] });
        }

        if (!wishlist.listings.includes(listingId)) {
            wishlist.listings.push(listingId);
            await wishlist.save();
            console.log("Added to wishlist successfully");
            req.flash("success", "Added to wishlist!");
        } else {
            console.log("Already in wishlist");
            req.flash("info", "Already in your wishlist!");
        }

        // Redirect back to the previous page or listings
        const referer = req.get('referer');
        if (referer && referer.includes('/listings')) {
            res.redirect(referer);
        } else {
            res.redirect("/listings");
        }
    } catch (err) {
        console.error("Error adding to wishlist:", err);
        req.flash("error", "Failed to add to wishlist");
        res.redirect("/listings");
    }
};

module.exports.removeFromWishlist = async (req, res) => {
    try {
        const { listingId } = req.params;
        const userId = req.user._id;
        
        console.log("Removing listing", listingId, "from wishlist for user", userId);

        const result = await Wishlist.findOneAndUpdate(
            { user: userId },
            { $pull: { listings: listingId } },
            { new: true }
        );

        if (result) {
            console.log("Removed from wishlist successfully");
            req.flash("success", "Removed from wishlist!");
        }
        
        res.redirect("/wishlist");
    } catch (err) {
        console.error("Error removing from wishlist:", err);
        req.flash("error", "Failed to remove from wishlist");
        res.redirect("/wishlist");
    }
};
