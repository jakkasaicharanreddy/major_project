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
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=60",
    },
    filename: String,
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
  latitude: {
    type: Number,
    min: -90,
    max: 90
  },
  longitude: {
    type: Number,
    min: -180,
    max: 180
  },
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
