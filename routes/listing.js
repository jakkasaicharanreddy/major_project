const express = require("express");
const router = express.Router();
const listing = require("../models/listing");
const wrapAsync = require("../utils/wrapAsync");
let ExpressError = require("../utils/ExpressError.js");




router.get(
  "/",
  wrapAsync(async (req, res) => {
    const allListings = await listing.find({});
    res.render("listings/index", { allListings });
  })
);

router.get("/new", (req, res) => {
  res.render("listings/new");
});

router.get(
  "/:id",
  wrapAsync(async (req, res) => {

    
    let id = req.params.id;
    let list = await listing.findById(id).populate("reviews");
    console.log(list);
    if (!list) {
      req.flash("error","listing not found please check carefully");
      return res.redirect("/listings");
    }
    res.render("listings/show", { list });
  })
);

router.post(
  "/",
  wrapAsync(async (req, res, next) => {
    if (!req.body.listing) {
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

router.get(
  "/:id/edit",
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

router.put(
  "/:id",
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

router.delete(
  "/:id",
  wrapAsync(async (req, res) => {
    let id = req.params.id;
    await listing.findByIdAndDelete(id);
    req.flash("success", "Successfully deleted the listing");
    console.log("Deleted listing with id:", id);
    res.redirect("/listings");
  })
);

module.exports = router;