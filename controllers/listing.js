const listing = require("../models/listing.js");
const Booking = require("../models/booking");
const ExpressError = require("../utils/ExpressError.js");

function parseMaxGuests(value) {
    const maxGuests = Number(value);
    if (!Number.isInteger(maxGuests) || maxGuests < 1 || maxGuests > 20) {
        return null;
    }
    return maxGuests;
}

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports.index = async (req, res) => {
    const { q, search, minPrice, maxPrice, guests, sort = 'newest', page = 1, limit = 12 } = req.query;
    const keyword = (q || search || "").trim();
    let query = {};
    let sortOptions = {};

    // Keyword search (case-insensitive across title, location, country, description)
    if (keyword) {
        const pattern = escapeRegex(keyword);
        query.$or = [
            { title: { $regex: pattern, $options: "i" } },
            { location: { $regex: pattern, $options: "i" } },
            { country: { $regex: pattern, $options: "i" } },
            { description: { $regex: pattern, $options: "i" } }
        ];
    }

    // Price filters (valid positive numbers only; invalid values are safely ignored)
    const parsedMinPrice = Number(minPrice);
    const parsedMaxPrice = Number(maxPrice);
    if (
        (minPrice !== undefined && minPrice !== "" && Number.isFinite(parsedMinPrice) && parsedMinPrice > 0) ||
        (maxPrice !== undefined && maxPrice !== "" && Number.isFinite(parsedMaxPrice) && parsedMaxPrice > 0)
    ) {
        query.price = {};
        if (Number.isFinite(parsedMinPrice) && parsedMinPrice > 0) {
            query.price.$gte = parsedMinPrice;
        }
        if (Number.isFinite(parsedMaxPrice) && parsedMaxPrice > 0) {
            query.price.$lte = parsedMaxPrice;
        }
    }

    // Guest capacity filter (positive integer; legacy listings without maxGuests are still included)
    const parsedGuests = Number(guests);
    if (guests !== undefined && guests !== "" && Number.isInteger(parsedGuests) && parsedGuests > 0) {
        query.$and = [
            {
                $or: [
                    { maxGuests: { $gte: parsedGuests } },
                    { maxGuests: { $exists: false } }
                ]
            }
        ];
    }

    // Sort whitelist (never trust arbitrary sort expressions from the browser)
    switch (sort) {
        case "price_asc":
        case "price-low":
            sortOptions = { price: 1 };
            break;
        case "price_desc":
        case "price-high":
            sortOptions = { price: -1 };
            break;
        case "oldest":
            sortOptions = { createdAt: 1, _id: 1 };
            break;
        case "newest":
        default:
            sortOptions = { createdAt: -1, _id: -1 };
            break;
    }

    const skip = (page - 1) * limit;
    const allListings = await listing.find(query).sort(sortOptions).skip(skip).limit(parseInt(limit));
    const totalListings = await listing.countDocuments(query);
    const totalPages = Math.ceil(totalListings / limit);

    const hasActiveFilters = !!(keyword || parsedMinPrice > 0 || parsedMaxPrice > 0 || parsedGuests > 0);

    res.render("listings/index", {
        allListings,
        q: keyword,
        minPrice: minPrice || "",
        maxPrice: maxPrice || "",
        guests: guests || "",
        sort: sort || "newest",
        totalListings,
        hasActiveFilters,
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
    let { title, description, image, price, location, country, maxGuests } = req.body;
    const parsedMaxGuests = parseMaxGuests(maxGuests);
    if (!parsedMaxGuests) {
      req.flash("error", "Maximum guests must be a whole number between 1 and 20");
      return res.redirect("/listings/new");
    }
    let newListing = new listing({
      title,
      description,
      image: { url: image },
      price,
      location,
      country,
      maxGuests: parsedMaxGuests,
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
    let { title, description, image, price, location, country, maxGuests } = req.body;
    const parsedMaxGuests = parseMaxGuests(maxGuests);
    if (!parsedMaxGuests) {
      req.flash("error", "Maximum guests must be a whole number between 1 and 20");
      return res.redirect(`/listings/${id}/edit`);
    }
    await listing.findByIdAndUpdate(id, {
      title,
      description,
      image: { url: image },
      price,
      location,
      country,
      maxGuests: parsedMaxGuests,
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