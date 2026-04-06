const listing = require("../models/listing.js");
const Booking = require("../models/booking");
const ExpressError = require("../utils/ExpressError.js");

module.exports.index = async (req, res) => {
    const { search, minPrice, maxPrice, sort = 'newest', page = 1, limit = 12 } = req.query;
    let query = {};
    let sortOptions = {};

    // Build search query
    if (search) {
        query.$or = [
            { title: { $regex: search, $options: 'i' } },
            { location: { $regex: search, $options: 'i' } },
            { country: { $regex: search, $options: 'i' } }
        ];
    }

    // Build price filter
    if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = parseInt(minPrice);
        if (maxPrice) query.price.$lte = parseInt(maxPrice);
    }

    // Build sort options
    switch (sort) {
        case 'oldest':
            sortOptions = { createdAt: 1, _id: 1 };
            break;
        case 'price-low':
            sortOptions = { price: 1 };
            break;
        case 'price-high':
            sortOptions = { price: -1 };
            break;
        case 'newest':
        default:
            sortOptions = { createdAt: -1, _id: -1 };
            break;
    }

    const skip = (page - 1) * limit;
    const allListings = await listing.find(query).sort(sortOptions).skip(skip).limit(parseInt(limit));
    const totalListings = await listing.countDocuments(query);
    const totalPages = Math.ceil(totalListings / limit);

    res.render("listings/index", {
        allListings,
        search: search || '',
        minPrice: minPrice || '',
        maxPrice: maxPrice || '',
        sort: sort || 'newest',
        currentPage: parseInt(page),
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        nextPage: parseInt(page) + 1,
        prevPage: parseInt(page) - 1
    });
}

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new");
};

module.exports.showListing = async (req, res) => {
    try {
        let id = req.params.id;
        console.log("Received request to show listing with ID:", id);
        console.log("Fetching listing with ID:", id);
        
        let list = await listing.findById(id)
        .populate({
          path: "reviews",
          populate: { path: "owner" }
        })
        .populate("owner");
      
        if (!list) {
            console.log("Listing not found for ID:", id);
            req.flash("error","Listing not found. Please try again.");
            return res.redirect("/listings");
        }
       
        console.log("Listing found:", list.title);
        res.render("listings/show", { list });
    } catch (err) {
        console.error("Error in showListing:", err);
        req.flash("error", "Error loading listing");
        res.redirect("/listings");
    }
}

  module.exports.createListing = async (req, res, next) => {

    let url = req.file.path;
    let filename = req.file.filename;

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
    newListing.image.url = url;
    newListing.image.filename = filename;
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
  }

  module.exports.renderEditForm = async (req, res) => {
      let id = req.params.id;
      let list = await listing.findById(id);
      if (!list) {
        req.flash("error","listing not found please check carefully");
        return res.redirect("/listings");
      }
      res.render("listings/edit", { list });
    }

    module.exports.updateListing = async (req, res) => {
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
  }

  module.exports.deleteListing = async (req, res) => {
    let id = req.params.id;
    await Booking.deleteMany({ listing: id });
    await listing.findByIdAndDelete(id);
    req.flash("success", "Successfully deleted the listing");
    res.redirect("/listings");
  }