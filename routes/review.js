const express = require("express");
const router = express.Router({mergeParams:true});
const listing = require("../models/listing");
const wrapAsync = require("../utils/wrapAsync");
let ExpressError = require("../utils/ExpressError.js");
const Review = require("../models/reviews.js");


router.post("/", async (req, res) => {
 let foundListing = await listing.findById(req.params.id);
 let review = new Review(req.body.review);
 foundListing.reviews.push(review);
 await review.save();
 await foundListing.save();
 req.flash("success","Successfully added review");
 res.redirect(`/listings/${foundListing.id}`);
});

router.delete("/:reviewId",async (req,res)=> {
  let {id ,reviewId} = req.params;
await listing.findByIdAndUpdate(id,{$pull:{reviews:reviewId}})
 await Review.findByIdAndDelete(reviewId);
req.flash("success","Successfully deleted review");
 res.redirect(`/listings/${id}`);
})

module.exports = router;