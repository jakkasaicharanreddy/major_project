const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passprtLocalMongoose = require("passport-local-mongoose"); 

// Passport-Local-Mongoose adds username, hash, and salt fields automatically
const userSchema = new Schema({
    email:{
        type:String,
        required:true,
    },
    // ---- Step 11: profile fields (all optional; never affect authentication) ----
    displayName:{
        type:String,
        trim:true,
        maxlength:80,
        default:"",
    },
    bio:{
        type:String,
        trim:true,
        maxlength:500,
        default:"",
    },
    location:{
        type:String,
        trim:true,
        maxlength:100,
        default:"",
    },
    profileImage:{
        type:String,
        trim:true,
        maxlength:500,
        default:"",
    },
})

// This plugin adds Passport authentication methods to the User model
userSchema.plugin(passprtLocalMongoose);

module.exports = mongoose.model("User",userSchema);

