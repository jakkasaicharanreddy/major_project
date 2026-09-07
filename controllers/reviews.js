const listing = require("../models/listing.js");
const Review = require("../models/reviews.js");

module.exports.createReview = async (req, res) => {
 let foundListing = await listing.findById(req.params.id);
  // Prevent duplicate reviews: check before creating a new Review document
  const existingReview = await Review.findOne({
    owner: req.user._id,
    _id: { $in: foundListing.reviews }
  });
  if (existingReview) {
    req.flash("error", "You have already reviewed this listing.");
    return res.redirect(`/listings/${foundListing.id}`);
  }
  // Server-side rating validation (do not rely only on the HTML form)
  const rating = Number(req.body.review && req.body.review.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    req.flash("error", "Rating must be a whole number between 1 and 5.");
    return res.redirect(`/listings/${foundListing.id}`);
  }
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