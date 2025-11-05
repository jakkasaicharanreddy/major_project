const express = require("express");
const router = express.Router();
const listing = require("../models/listing.js");
const wrapAsync = require("../utils/wrapAsync");
let ExpressError = require("../utils/ExpressError.js");
let {isLoggedin, isOwner} = require("../midlewares.js");



//all listings route
router.get(
  "/",
  wrapAsync(async (req, res) => {
    const allListings = await listing.find({});
    res.render("listings/index", { allListings });
  })
);

//new listing route
router.get("/new",isLoggedin, (req, res) => {
  res.render("listings/new");
});

//show particular listing route
router.get(
  "/:id",
  wrapAsync(async (req, res) => {

    
    let id = req.params.id;
    let list = await listing.findById(id)
    .populate({
      path: "reviews",
      populate: { path: "owner" }
    })
    .populate("owner");
  
    if (!list) {
      req.flash("error","listing not found please check carefully");
      return res.redirect("/listings");
    }
   
    res.render("listings/show", { list });
  })
);

//create new listing route
router.post(
  "/",
  isLoggedin,
  wrapAsync(async (req, res, next) => {

    if (!req.body) {
      throw new ExpressError(400, "All fields are required");
    }
    let { title, description, image, price, location, country } = req.body;
    let newListing = new listing({
      title,
      description,
      image: { url: image },
      price,
      location,
      country,
    });
    newListing.owner = req.user._id;
    await newListing.save();
    req.flash("success","Successfully created a new listing");
    res.redirect("/listings");

    // try{
    //   let { title,description,image,price,location,country } = req.body;
    // // console.log(title,description,image,price,location,country);
    // let newListing = new listing({ title,description,image:{url:image},price,location,country });
    // await newListing.save();
    // res.redirect("/listings");
    // }
    // catch(err){
    //   next(err);
    // }
  })
);

//edit listing route
router.get(
  "/:id/edit",
  isLoggedin,
  isOwner,
  wrapAsync(async (req, res) => {
    let id = req.params.id;
    let list = await listing.findById(id);
    if (!list) {
      req.flash("error","listing not found please check carefully");
      return res.redirect("/listings");
    }
    res.render("listings/edit", { list });
  })
);

//update listing route
router.put(
  "/:id",
  isOwner,
  wrapAsync(async (req, res) => {
    let id = req.params.id;
    let { title, description, image, price, location, country } = req.body;
    await listing.findByIdAndUpdate(id, {
      title,
      description,
      image: { url: image },
      price,
      location,
      country,
    });
    req.flash("success","updated successfully")
    res.redirect(`/listings/${id}`);
  })
);

//delete listing route
router.delete(
  "/:id",
  isLoggedin,
  isOwner,
  wrapAsync(async (req, res) => {
    let id = req.params.id;
    await listing.findByIdAndDelete(id);
    req.flash("success", "Successfully deleted the listing");
    res.redirect("/listings");
  })
);

module.exports = router;