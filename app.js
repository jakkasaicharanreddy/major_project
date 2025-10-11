const express = require("express");
const app = express();
const mongoose = require("mongoose");
const listing = require("./models/listing");

main()
  .then(() => console.log("connected"))
  .catch((err) => console.log(err));

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/wonderlust");
}

app.listen("8080", () => {
  console.log("app is listening");
});

app.get("/", async (req, res) => {
   
});
