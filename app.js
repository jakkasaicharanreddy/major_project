const express = require("express");
const app = express();
const mongoose = require("mongoose");
const listing = require("./models/listing");
const path = require("path");
const methoidOverride = require("method-override");
const ejsMate = require("ejs-mate");

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

app.engine("ejs",ejsMate);

app.listen("8080", () => {
  console.log("app is listening");
});

app.get("/", (req, res) => {
  res.send("Wanderlust");
});

app.get("/listings", async (req, res) => {
   const allListings  = await listing.find({});
   res.render("listings/index", { allListings });
});

app.get("/listings/new",(req,res) => {
    res.render("listings/new");
})

app.get("/listings/:id", async (req, res) => {
  let id = req.params.id;
  let list = await listing.findById(id);
  res.render("listings/show", { list });
});

app.post("/listings",(req,res) => {
    let { title,description,image,price,location,country } = req.body;
    // console.log(title,description,image,price,location,country);
    let newListing = new listing({ title,description,image:{url:image},price,location,country });
    newListing.save();
    res.redirect("/listings");
})

app.get("/listings/:id/edit",async (req,res) => {
    let id = req.params.id;
    let list = await listing.findById(id);
    res.render("listings/edit",{list});
})

app.put("/listings/:id",async (req,res) => {
    let id = req.params.id;
    let { title,description,image,price,location,country } = req.body;
    await listing.findByIdAndUpdate(id,{ title,description,image:{url:image},price,location,country });
    res.redirect(`/listings/${id}`);
})

app.delete("/listings/:id",async (req,res) => {
    let id = req.params.id;
    await listing.findByIdAndDelete(id);
    res.redirect("/listings");
})