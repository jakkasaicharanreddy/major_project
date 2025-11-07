const express = require("express");
const router = express.Router();
const listing = require("../models/listing.js");
const wrapAsync = require("../utils/wrapAsync");
let ExpressError = require("../utils/ExpressError.js");
let {isLoggedin, isOwner} = require("../midlewares.js");
const listingController = require("../controllers/listing.js");

const multer = require("multer");
const { storage } = require("../cloudConfig.js"); 
const upload = multer({ storage: storage });



//all listings route
router.get(
  "/",
  wrapAsync(listingController.index)
);

//new listing route
router.get("/new",isLoggedin, listingController.renderNewForm);

//show particular listing route
router.get(
  "/:id",
  wrapAsync(listingController.showListing)
);

//create new listing route
router.post(
  "/",
  isLoggedin,
  upload.single("image"),
  wrapAsync(listingController.createListing)
);
// router.post("/", upload.single("image"), (req, res) => {
//   res.send(req.file);
// });

//edit listing route
router.get(
  "/:id/edit",
  isLoggedin,
  isOwner,
  wrapAsync(listingController.renderEditForm)
);

//update listing route
router.put(
  "/:id",
  isOwner,
  wrapAsync(listingController.updateListing)
);

//delete listing route
router.delete(
  "/:id",
  isLoggedin,
  isOwner,
  wrapAsync(listingController.deleteListing)
);

module.exports = router;