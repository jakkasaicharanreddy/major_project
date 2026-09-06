if(process.env.NODE_ENV != "production"){
require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methoidOverride = require("method-override");
const ejsMate = require("ejs-mate");
let ExpressError = require("./utils/ExpressError.js");
const Review = require("./models/reviews.js");


//const cookieParser = require("cookie-parser");
const session = require("express-session");
const flash = require("connect-flash");

const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");




//cookie parser middleware
//app.use(cookieParser("secret"));
//session middleware
app.use(session({
  secret: "secret",
  resave: false,
  saveUninitialized: true
}));
//flash middleware
app.use(flash());

//passport configuration
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());




//requiring the routes files

const listingsRoute = require("./routes/listing.js");
const reviewsRoute = require("./routes/review.js");
const userRoute = require("./routes/user.js");
const wishlistRoute = require("./routes/wishlist.js");
const bookingRoute = require("./routes/booking.js");

//connecting to database

main()
  .then(() => console.log("connected"))
  .catch((err) => console.log(err));

async function main() {
  const atlasUrl = process.env.ATLASDB_URL;
  const localUrl = "mongodb://127.0.0.1:27017/wonderlust";

  try {
    await mongoose.connect(atlasUrl || localUrl);
    console.log("Connected to MongoDB:", atlasUrl || localUrl);
  } catch (atlasErr) {
    console.warn("Atlas connection failed, trying local MongoDB...", atlasErr.message);

    try {
      await mongoose.connect(localUrl);
      console.log("Connected to local MongoDB:", localUrl);
    } catch (localErr) {
      console.error("Could not connect to MongoDB. Start MongoDB locally or set a valid ATLASDB_URL.");
      console.error(localErr);
      process.exit(1);
    }
  }
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));

app.use(express.static("public"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methoidOverride("_method"));

app.engine("ejs", ejsMate);

//middlewares
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.curruser = req.user || null;
  next();
});

app.get("/", (req, res) => {  
  res.render("listings/home");
})

// getting routes from other files

app.use("/listings",listingsRoute);
app.use("/listings/:id/reviews",reviewsRoute);
app.use("/",userRoute);
app.use("/wishlist", wishlistRoute);
app.use("/bookings", bookingRoute);


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
