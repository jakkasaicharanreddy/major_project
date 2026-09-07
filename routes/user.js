const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const passport = require("passport");
const middlewares = require("../midlewares.js");

const userController = require("../controllers/user.js");
const user = require("../models/user.js");
const dashboardController = require("../controllers/dashboard.js");


router.get("/signUp", userController.signupForm);

router.post("/signUp",userController.signup );

router.get("/login", userController.loginForm);

router.post("/login",     middlewares.saveRedirectUrl, passport.authenticate("local",
    {failureRedirect:"/login",
        failureFlash:true
    }),
    userController.login
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


// ---- Step 11: profile routes (authentication required via existing isLoggedin middleware) ----
router.get("/users/profile", middlewares.isLoggedin, userController.showProfile);

router.post("/users/profile", middlewares.isLoggedin, userController.updateProfile);

router.get("/dashboard", middlewares.isLoggedin, dashboardController.dashboard);

router.get("/logout",userController.logout );

module.exports = router;