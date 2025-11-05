const mongoose = require("mongoose");
const express = require("express");
const app = express();
const listing = require("../models/listing");
const initdata = require("./data");

main()
  .then(() => console.log("connected"))
  .catch((err) => console.log(err));

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/wonderlust");
}


app.get("/", async (req, res) => {
  await listing.deleteMany();
  initdata.data = initdata.data.map((obj)=> ({
    ...obj,
    owner : "6901f3eb846b53f199bcddf2"
  }));
  await listing.insertMany(initdata.data);
  console.log("data added  to  database succesfully");
});

app.listen("8080", () => {
  console.log("index js  is listening");
});

