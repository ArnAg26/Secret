require("dotenv").config();
const express=require("express");
const bp=require("body-parser");
const app=express();
const mongoose=require("mongoose");
//const _=require("lodash");
const ejs=require("ejs");
const encrypt=require("mongoose-encryption");
const foc=require("mongoose-findorcreate");
const bcrypt=require("bcrypt");
const saltRounds=8;
const session=require("express-session");
const passport=require("passport");
const passportLocalMongoose=require("passport-local-mongoose");
const GoogleStrategy=require("passport-google-oauth20").Strategy;


app.use(bp.urlencoded({extended:true}));
app.use(express.static("public"));
app.set('view engine','ejs');

app.use(session({
    secret:"Our little secret",
    resave:false,
    saveUninitialized:false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.set('strictQuery',false);

mongoose.connect("mongodb://127.0.0.1:27017/UsersDB")

const userSchema=new mongoose.Schema({
    email:String,
    password:String,
    googleId:String,
    secret:String
})
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(foc);
const secret=process.env.SECRET;


//userSchema.plugin(encrypt,{secret:secret,encryptedFields:['password']});

const User=mongoose.model("User",userSchema);

passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(process.env.CLIENT_ID);
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
        
      return cb(err, user);
    });
  }
));


app.get("/secret",function(req,res){
    User.find({"secret":{$ne:null}},function(err,foundUsers){
        if(err){
            console.log(err);
        }
        else{
            res.render("secrets",{usersWithSecrets:foundUsers});
        }
    })
})

app.post("/register",function(req,res){
    User.register({username:req.body.username},req.body.password,function(err,user){
        if(err){
            console.log(err);
            res.redirect("/register");
        }else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secret");
            })
        }
        
        
    })
    
})

app.get("/submit",function(req,res){
    if(req.isAuthenticated()){
        res.render("submit");
    }
    else{
        res.redirect("/login");
    }

})

app.post("/submit",function(req,res){
    const sec=req.body.secret;
    const user=req.user.id;
    User.findById(user,function(err,foundUser){
        if(err){
            console.log(err);
        }
        else{
            if(foundUser){
                foundUser.secret=sec;
                foundUser.save();
                res.redirect("/secret");
            }
        }
    })

})


app.post("/login",function(req,res){
    const user=new User({
        username:req.body.username,
        password:req.body.password
    })
    req.login(user,function(err){
        if(err){
            console.log(err);
        }
        else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secret");
            })
        }
    })
});
app.get("/",function(req,res){
    res.render("home");
})

app.get("/auth/google",
    passport.authenticate("google",{scope:["profile"]})
);

app.get("/auth/google/secrets",passport.authenticate("google",{failureRedirect:"/login"}),function(req,res){
    res.redirect("/secret");
})

app.get("/register",function(req,res){
    res.render("register");
})

app.get("/login",function(req,res){
    res.render("login");
})

app.get("/logout",function(req,res){
    req.logout(function(err){
        if(err){
            console.log(err);
        }
    });
    res.redirect("/")
})

app.listen(3000,function(){
    console.log("Serving on port 3000");
});


