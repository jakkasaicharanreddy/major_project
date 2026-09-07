const listing = require("./models/listing");
const Review = require("./models/reviews") 

module.exports.isLoggedin = (req,res,next)=>{
    if(!req.isAuthenticated()){
        req.session.redirectUrl = req.originalUrl;

    req.flash("error","You must be logged in to perform this action");
    return res.redirect("/login");
  }
  next();
}

module.exports.saveRedirectUrl = (req,res,next)=>{
    if(req.session.redirectUrl){
        res.locals.redirectUrl = req.session.redirectUrl;
        console.log("redirectUrl saved:", res.locals.redirectUrl);
    }
    next();
}

module.exports.isOwner = async (req,res,next)=>{
    let id = req.params.id;
    let list = await listing.findById(id);
    if (!list) {
      req.flash("error","Listing not found");
      return res.redirect("/listings");
    }
    if( req.user && list.owner && !req.user._id.equals(list.owner)){
      req.flash("error","You are not allowed to do this action");
      return res.redirect(`/listings/${id}`);
    }
    next();
}

module.exports.isReviewOwner = async (req,res,next)=>{
     let {id ,reviewId} = req.params;
    let review = await Review.findById(reviewId)
    if (!review) {
      req.flash("error","Review not found");
      return res.redirect(`/listings/${id}`);
    }
    if( req.user && !req.user._id.equals(review.owner)){
      req.flash("error","You are not allowed to do this action");
      return res.redirect(`/listings/${id}`);
    }
    next();
}
