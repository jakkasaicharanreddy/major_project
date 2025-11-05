const express = require("express");
const router = express.Router({mergeParams:true});
const listing = require("../models/listing.js");
const wrapAsync = require("../utils/wrapAsync");
let ExpressError = require("../utils/ExpressError.js");
const Review = require("../models/reviews.js");
const { isReviewOwner } = require("../midlewares.js")

//add a review to a listing
router.post("/", async (req, res) => {
 let foundListing = await listing.findById(req.params.id);
  let review = new Review(req.body.review);
  review.owner = req.user._id;//assigning the review owner
  console.log("review object:", review);
  foundListing.reviews.push(review);
  await review.save();
  await foundListing.save();
  req.flash("success","Successfully added review");
  res.redirect(`/listings/${foundListing.id}`);
});

router.delete("/:reviewId",isReviewOwner,async (req,res)=> {
  let {id ,reviewId} = req.params;
await listing.findByIdAndUpdate(id,{$pull:{reviews:reviewId}})
 await Review.findByIdAndDelete(reviewId);
req.flash("success","Successfully deleted review");
 res.redirect(`/listings/${id}`);
})

module.exports = router;