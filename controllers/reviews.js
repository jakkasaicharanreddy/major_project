const listing = require("../models/listing.js");
const Review = require("../models/reviews.js");

module.exports.createReview = async (req, res) => {
 let foundListing = await listing.findById(req.params.id);
  let review = new Review(req.body.review);
  review.owner = req.user._id;//assigning the review owner
  // console.log("review object:", review);
  foundListing.reviews.push(review);
  await review.save();
  await foundListing.save();
  req.flash("success","Successfully added review");
  res.redirect(`/listings/${foundListing.id}`);
}

module.exports.deleteReview = async (req,res)=> {
  let {id ,reviewId} = req.params;
await listing.findByIdAndUpdate(id,{$pull:{reviews:reviewId}})
 await Review.findByIdAndDelete(reviewId);
req.flash("success","Successfully deleted review");
 res.redirect(`/listings/${id}`);
}