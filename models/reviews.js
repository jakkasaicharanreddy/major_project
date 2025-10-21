const mongoose = require("mongoose");
let { Schema } = mongoose;

const reviewSchema = new Schema({
  comment: { type: String, },
  rating: { type: Number, min: 1, max: 5,},
  createdAt: { type: Date, default: Date.now() },
});


module.exports = mongoose.model("Review", reviewSchema);
