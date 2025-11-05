const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const passport = require("passport");
const middlewares = require("../midlewares.js");




router.get("/signUp", (req, res) => {
    res.render("users/signUp");
});

router.post("/signUp", async (req, res) => {

    try{
        let {username , email, password} = req.body;
    console.log(req.body);

    let newUser = new User({ username,email});

    let registeredUser = await User.register(newUser,password);
    req.login(registeredUser, (err) => {
        if(err){
            return next(err)
        }
            req.flash("success","Welcome to wanderlust ! You registerd & LoggedIn successfully");
    return res.redirect("/listings")
    })

    }
    catch(e){
        req.flash("error",e.message);
        return res.redirect("/signUp");
    }
});

router.get("/login", (req, res) => {
    res.render("users/login");
});

router.post("/login",     middlewares.saveRedirectUrl, passport.authenticate("local",
    {failureRedirect:"/login",
        failureFlash:true
    }),

    async (req, res) => {
       
        req.flash("success", "Welcome back to Wanderlust! You are LoggedIn");
        return res.redirect(res.locals.redirectUrl  || "/listings");
    }

);

//demo route to register a fake user

// router.get("/register", async (req, res) => {
//     let fakeuser = new User({ username: "user", email: "jakka@gmail.com" });
//     // User.register() is added by passport-local-mongoose
//     // It:
//     // 1. Hashes the password ("chicken123")
//     // 2. Saves username, hash, and salt to database
//     // 3. Returns the saved user object
//     let registeredUser = await User.register(fakeuser, "chicken123");
//     res.send(registeredUser);

// });


router.get("/logout", (req, res, next) => {
    if(req.user){
        req.logout((err)=>{
        if(err){
            return next(err);
        }
        req.flash("success","You are Logged Out")
    res.redirect("/listings");
    })

    }else{
        req.flash("error","You are not LoggedIn")
        res.redirect("/listings");
    }
    
})

module.exports = router;