const express = require("express");
const app = express();
const mongoose = require("mongoose");
const listing = require("./models/listing");
const path = require("path");
const methoidOverride = require("method-override");
const ejsMate = require("ejs-mate");
let wrapAsync = require("./utils/wrapAsync.js");
let ExpressError = require("./utils/ExpressError.js");
const Review = require("./models/reviews.js");

main()
  .then(() => console.log("connected"))
  .catch((err) => console.log(err));

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/wonderlust");
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));

app.use(express.static("public"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methoidOverride("_method"));

app.engine("ejs", ejsMate);


app.get("/", (req, res) => {
  res.send("Wanderlust");
});

app.get(
  "/listings",
  wrapAsync(async (req, res) => {
    const allListings = await listing.find({});
    res.render("listings/index", { allListings });
  })
);

app.get("/listings/new", (req, res) => {
  res.render("listings/new");
});

app.get(
  "/listings/:id",
  wrapAsync(async (req, res) => {
    let id = req.params.id;
    let list = await listing.findById(id).populate("reviews");
    res.render("listings/show", { list });
  })
);

app.post(
  "/listings",
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

app.get(
  "/listings/:id/edit",
  wrapAsync(async (req, res) => {
    let id = req.params.id;
    let list = await listing.findById(id);
    res.render("listings/edit", { list });
  })
);

app.put(
  "/listings/:id",
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

app.delete(
  "/listings/:id",
  wrapAsync(async (req, res) => {
    let id = req.params.id;
    await listing.findByIdAndDelete(id);
    res.redirect("/listings");
  })
);

//reviews
// craete post route

app.post("/listings/:id/reviews", async (req, res) => {
 let foundListing = await listing.findById(req.params.id);
 let review = new Review(req.body.review);
 foundListing.reviews.push(review);
 await review.save();
 await foundListing.save();
 res.redirect(`/listings/${foundListing.id}`);
});

app.delete("/listings/:id/reviews/:reviewId",async (req,res)=> {
  let {id ,reviewId} = req.params;
await listing.findByIdAndUpdate(id,{$pull:{reviews:reviewId}})
 await Review.findByIdAndDelete(id);

 res.redirect(`/listings/${id}`);
})

app.use("/", (req, res, next) => {
  next(new ExpressError(404, "Page Not Found"));
});

app.use((err, req, res, next) => {
  let { statusCode = 500, message = "Something went wrong" } = err;
  res.render("listings/error", { err });
  // res.status(statusCode).send(message);
});

app.listen("8080", () => {
  console.log("app is listening");
});
