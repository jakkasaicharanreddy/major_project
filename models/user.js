const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passprtLocalMongoose = require("passport-local-mongoose"); 

// Passport-Local-Mongoose adds username, hash, and salt fields automatically
const userSchema = new Schema({
    email:{
        type:String,
        required:true,
    }
})

// This plugin adds Passport authentication methods to the User model
userSchema.plugin(passprtLocalMongoose);

module.exports = mongoose.model("User",userSchema);

