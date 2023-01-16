require("dotenv").config();
const express=require("express");
const bp=require("body-parser");
const app=express();
const mongoose=require("mongoose");
//const _=require("lodash");
const ejs=require("ejs");
const encrypt=require("mongoose-encryption");
app.use(bp.urlencoded({extended:true}));
app.use(express.static("public"));
app.set('view engine','ejs');
mongoose.connect("mongodb://127.0.0.1:27017/UsersDB")

const userSchema=new mongoose.Schema({
    email:String,
    password:String
})

const secret=process.env.SECRET;

userSchema.plugin(encrypt,{secret:secret,encryptedFields:['password']});

const User=mongoose.model("User",userSchema);

app.post("/register",function(req,res){
    const user=new User({
        email:req.body.username,
        password:req.body.password
    })
    user.save(function(err){
        if(err){
            console.log(err);
        }
        else{
            res.render("secrets");
        }
    });
})


app.post("/login",function(req,res){
    User.findOne({email:req.body.username},function(err,bt){
        if(err){
            console.log(err);
        }
        else{
            if(bt.password===req.body.password){
                res.render("secrets");
            }
            else{
                res.send("Sorry! Invalid password");
            }
        }
    })
})
app.get("/",function(req,res){
    res.render("home");
})

app.get("/register",function(req,res){
    res.render("register");
})

app.get("/login",function(req,res){
    res.render("login");
})


app.listen(3000,function(){
    console.log("Serving on port 3000");
});


