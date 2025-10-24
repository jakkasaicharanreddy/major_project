const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methoidOverride = require("method-override");
const ejsMate = require("ejs-mate");
let ExpressError = require("./utils/ExpressError.js");
const Review = require("./models/reviews.js");

//requiring the routes files

const listings = require("./routes/listing.js");
const reviews = require("./routes/review.js");

//connecting to database

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

// getting routes from other files

app.get("/", (req, res) => {
  res.send("Wanderlust");
});

app.use("/listings",listings);
app.use("/listings/:id/reviews",reviews);


//error handling

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
