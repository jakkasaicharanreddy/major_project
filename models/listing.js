const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema({
    title: {
        type:String,
        required:true,
        maxlength:30
    },
    description : String,
    image:{
        type:Object,
        url:{
            type:String,
        default:"https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.houseplans.com%2Fblog%2Fbuild-an-airbnb-home-its-not-just-for-millennials&psig=AOvVaw1L-qGkNwOgsaEtSdBv8rOx&ust=1760249153567000&source=images&cd=vfe&opi=89978449&ved=0CBIQjRxqFwoTCNCT76_Am5ADFQAAAAAdAAAAABAE",

        }
    },
    price: Number,
    location:String,
    country:String,
});

const listing = mongoose.model("listing",listingSchema);

module.exports = listing;