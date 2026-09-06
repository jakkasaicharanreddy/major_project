const mongoose = require("mongoose");
let { Schema } = mongoose;
const Review = require("./reviews.js");
const Booking = require("./booking");


const listingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    maxlength: 3000,
  },
  description: String,
  image: {
    type: Object,
    url: {
      type: String,
      default:
        "https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.houseplans.com%2Fblog%2Fbuild-an-airbnb-home-its-not-just-for-millennials&psig=AOvVaw1L-qGkNwOgsaEtSdBv8rOx&ust=1760249153567000&source=images&cd=vfe&opi=89978449&ved=0CBIQjRxqFwoTCNCT76_Am5ADFQAAAAAdAAAAABAE",
    },
    filenamwe: String,
  },
  price: Number,
  maxGuests: {
    type: Number,
    required: true,
    min: 1,
    max: 20,
    default: 2,
  },
  location: String,
  country: String,
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: "Review",
    },
  ],
  owner : {
    type : Schema.Types.ObjectId,
    ref : "User",
  }
}, { timestamps: true });

listingSchema.post("findOneAndDelete", async function (listing) {
    if (!listing) return;
    await Review.deleteMany({ _id: { $in: listing.reviews } });
    await Booking.deleteMany({ listing: listing._id });
});


const listing = mongoose.model("listing", listingSchema);

module.exports = listing;
