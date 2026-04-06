const mongoose = require("mongoose");
const { Schema } = mongoose;

const wishlistSchema = new mongoose.Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    listings: [{
        type: Schema.Types.ObjectId,
        ref: "listing"
    }]
});

const Wishlist = mongoose.model("Wishlist", wishlistSchema);

module.exports = Wishlist;