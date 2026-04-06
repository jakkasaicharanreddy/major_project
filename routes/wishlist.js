const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync");
const { isLoggedin } = require("../midlewares");
const wishlistController = require("../controllers/wishlist");

// View wishlist - MUST come first
router.get("/", isLoggedin, wrapAsync(wishlistController.viewWishlist));

// Add to wishlist
router.post("/:listingId", isLoggedin, wrapAsync(wishlistController.addToWishlist));

// Remove from wishlist
router.delete("/:listingId", isLoggedin, wrapAsync(wishlistController.removeFromWishlist));

module.exports = router;