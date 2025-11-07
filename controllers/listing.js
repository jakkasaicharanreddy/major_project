const listing =  require("../models/listing.js");

module.exports.index = async (req, res) => {
    const allListings = await listing.find({});
    res.render("listings/index", { allListings });
  }

  module.exports.renderNewForm = (req, res) => {
  res.render("listings/new");
};

module.exports.showListing = async (req, res) => {

    
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
    await listing.findByIdAndDelete(id);
    req.flash("success", "Successfully deleted the listing");
    res.redirect("/listings");
  }