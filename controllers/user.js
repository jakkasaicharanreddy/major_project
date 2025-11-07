const User = require("../models/user.js");

module.exports.signupForm = (req, res) => {
    res.render("users/signUp");
}

module.exports.signup = async (req, res) => {

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
}

module.exports.loginForm = (req, res) => {
    res.render("users/login");
}

module.exports.login = async (req, res) => {
       
        req.flash("success", "Welcome back to Wanderlust! You are LoggedIn");
        return res.redirect(res.locals.redirectUrl  || "/listings");
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