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
    res.redirect(`/listings/${id}`);
  })
);

router.delete(
  "/:id",
  wrapAsync(async (req, res) => {
    let id = req.params.id;
    await listing.findByIdAndDelete(id);
    res.redirect("/listings");
  })
);

module.exports = router;