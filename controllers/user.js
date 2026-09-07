const User = require("../models/user.js");

// ---- Step 11: profile validation limits (server-side; HTML attributes are not trusted) ----
const PROFILE_LIMITS = {
    displayName: 80,
    bio: 500,
    location: 100,
    profileImage: 500
};

module.exports.signupForm = (req, res) => {
    res.render("users/signUp");
}

module.exports.signup = async (req, res, next) => {

    try{
        let {username , email, password} = req.body;

    let newUser = new User({ username,email});

    let registeredUser = await User.register(newUser,password);
    req.login(registeredUser, (err) => {
        if(err){
            return next(err)
        }
            req.flash("success","Welcome to StayFinder! You registered & logged in successfully");
    return res.redirect("/listings")
    })

    }
    catch(e){
        req.flash("error",e.message);
        return res.redirect("/signUp");
    }
}

module.exports.loginForm = (req, res) => {
    res.render("users/login");
}

module.exports.login = async (req, res) => {
       
        req.flash("success", "Welcome back to Wanderlust! You are LoggedIn");
        return res.redirect(res.locals.redirectUrl  || "/listings");
    }

    // ---- Step 11: GET /users/profile — render the profile page for the logged-in user ----
    module.exports.showProfile = (req, res) => {
        // Always use the authenticated user from the session; never a browser-supplied id
        const user = req.user;
        return res.render("users/profile", { profileUser: user });
    }

    // ---- Step 11: POST /users/profile — update ONLY the editable profile fields ----
    module.exports.updateProfile = async (req, res) => {
        try {
            // Identify the user from the session only — req.user._id, never a form/userId field
            const user = await User.findById(req.user._id);
            if (!user) {
                req.flash("error", "You must be logged in to update your profile");
                return res.redirect("/login");
            }

            const body = req.body || {};

            // Helpers: trim to string, enforce server-side limits
            const cleanText = (value, maxLen) => {
                if (typeof value !== "string") return "";
                const trimmed = value.trim();
                return trimmed.length > maxLen ? trimmed.slice(0, maxLen) : trimmed;
            };

            // Validate profileImage: empty allowed, otherwise must be a well-formed http/https URL
            const cleanImageUrl = (value) => {
                if (typeof value !== "string") return "";
                const trimmed = value.trim();
                if (!trimmed) return "";
                if (trimmed.length > PROFILE_LIMITS.profileImage) return null; // signal invalid
                let parsed;
                try {
                    parsed = new URL(trimmed);
                } catch (e) {
                    return null; // not a valid absolute URL
                }
                if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
                return trimmed;
            };

            const displayName = cleanText(body.displayName, PROFILE_LIMITS.displayName);
            const bio = cleanText(body.bio, PROFILE_LIMITS.bio);
            const location = cleanText(body.location, PROFILE_LIMITS.location);
            const profileImage = cleanImageUrl(body.profileImage);

            if (profileImage === null) {
                req.flash("error", "Profile image must be a valid http(s) URL (max 500 characters)");
                return res.redirect("/users/profile");
            }

            // Only these four fields are written. username, email, hash, salt,
            // _id and any passport fields are intentionally never touched here.
            user.displayName = displayName;
            user.bio = bio;
            user.location = location;
            user.profileImage = profileImage;

            await user.save();
            req.flash("success", "Profile updated successfully");
            return res.redirect("/users/profile");
        } catch (err) {
            console.error("Error updating profile:", err);
            req.flash("error", "Could not update profile. Please try again.");
            return res.redirect("/users/profile");
        }
    }

    module.exports.logout = (req, res, next) => {
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
    
}