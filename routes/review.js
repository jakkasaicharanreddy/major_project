const express = require("express");
const router = express.Router({mergeParams:true});
const listing = require("../models/listing.js");
const wrapAsync = require("../utils/wrapAsync");
let ExpressError = require("../utils/ExpressError.js");
const Review = require("../models/reviews.js");
const { isReviewOwner, isLoggedin } = require("../midlewares.js")

const reviewController = require("../controllers/reviews.js");

//add a review to a listing
router.post("/", wrapAsync(reviewController.createReview));

router.delete("/:reviewId",isLoggedin,isReviewOwner, wrapAsync(reviewController.deleteReview));

module.exports = router;