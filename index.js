const dotenv = require('dotenv')
const express = require("express");
const bodyParser = require("body-parser");
require('dotenv').config()
const mongoose = require('mongoose');
const axios = require("axios");
var cors = require('cors');
var md5 = require('md5');
const jwt = require('jsonwebtoken');
const cookieParser=require("cookie-parser")
const nodemailer = require('nodemailer');



const app = express();

app.use(cors());
app.use(express.json());
app.use(bodyParser.json())
app.use(cookieParser())
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));




const uri=
"mongodb+srv://ismailchebaane:ismailchebaane@cluster0.oqucmgy.mongodb.net/?retryWrites=true&w=majority";


mongoose.connect(uri, function(err) {
       if (err) {
           console.log(err);
       } else {
           console.log("Successfully connected to mongo DB");
       }
   });




   var userShema = new mongoose.Schema({
    author:String,
    id:Number,
    title:String ,
    description: String,
    content: String,
    urlToImage: String,
    publishedAt: String,
    url:String,
},{collection:"blogs",});



const User = mongoose.model("blogs", userShema);




async function AdddingArticlesToMongoDB () {
 
  try {
    const response = await axios.get('https://newsapi.org/v2/top-headlines', {
      params: {
        country: 'us',
        apiKey: '8942c610251d4217a25d7330e5c4d554'
      }
    });

    const articles = response.data.articles;
  
    User.insertMany(articles,(err)=>{
      if(!err){
        console.log("success added")
      }else{  console.log(err)}
    })
  } catch (error) {
    console.error(error);
  }
 
  
  };
  
  
  
 // AdddingArticlesToMongoDB()
  


app.get("/posts",async(req,res)=>{
    try {
        const response = await User.find();
    
        const articles = response
      
        res.send(articles)
      } catch (error) {
        console.error(error);
      }
})


app.get("/post/:id",async(req,res)=>{
 
  try {
  
   User.findOne({ _id: req.params.id }, (error, object) => {
      if (error) {
        console.error(error);
      } else {
    
        res.send(object)
      }
      
    });
 
  
   
    
  } catch (error) {
    console.error(error);
  }
})




app.post("/write",async(req,res)=>{

 
 const { input, Title, textArea } = req.body;  

 User.countDocuments((err,count)=>{
        if(!err){
          
          const date = new Date();
       
          const month=date.getMonth() + 1
          const FullDate=date.getFullYear()+"/"+month+"/"+date.getDate()+"T"+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds()+"Z"
      const objectToInsert = new User( {
        author:"UNKOWN",
        id:count,
        title:Title ,
        description: textArea,
        content: textArea,
        urlToImage: input,
        publishedAt: FullDate,
        url:input,
  
       });
      
      objectToInsert.save((error) => {
        if (!error) {
          console.log('Object inserted successfully!');
       
        } else {
          console.error(error);
        }
      
      });

        }
      })
    
    

    
    
})

var Usersh = new mongoose.Schema({
  username:String,
  email:String,
  password:String ,
  postID:String
},{collection:"user",});



const Userlog = mongoose.model("user", Usersh);


app.post('/register',async (req,res)=> {
  try {
    
    const { username, email, password } = req.body;  
  
   const userexist= await Userlog.findOne({email});
   if(userexist){
    res.status(400).send({status:400});
  return;
  } else{
    
    const objectToInsert = await new  Userlog({
    username,
  email,
  password:md5(password),
  })
  objectToInsert.save((error) => {
    if (!error) {
      console.log('Registered done successfully!');
      
  
 res.status(200).send({status:200})

    } else {
      console.error(error);
    }
  
  });
}
  
  } catch (error) {
    console.log(error)
  }
  
  })
  




  
app.post("/login",async(req,res)=>{
  try{
  const {email } = req.body; 

   await Userlog.findOne({email},async(err,user)=>{
  if(!err){
    if(user){
  const isCorrect= user.password===(await md5(req.body.password))
  if(isCorrect){
    
    const secret="thisismysecret"
  const token=await jwt.sign({id:user._id},secret)
  //to get all info about user except his password and user._doc to get only user info not other info with user info
  await Userlog.updateOne({email:user.email},{token:token})
  const{password,...others}=user._doc
  
   res.cookie("access_token",token,{
    httpOnly:true
  }).status(200).json(others)
  
  }else{
    res.status(400).send({status:400})
    return;
  }
    }else{
      res.status(420).send({status:420})
      return;
    }
  }
  else{console.log(err)}
   }).clone();
  
  
  
  }catch(err){
  
    console.log(err)
  }
  
  
  
  })
  
  app.get("/logout",async(req, res)=>{
  res.clearCookie("access_token",{path:'/'})
  res.status(200).send("userLoggedOut")
  
  
  })
  
app.post('/updateAccount',async(req,res)=>{
const {email,username,password,id}=req.body;
 const pass=await md5(password);

Userlog.findByIdAndUpdate(id, { username: username, email: email, password: pass }, { new: true })
  .then((user) => {
    if (!user) {
      res.status(404).send('User not found');
    } else {
      res.send('User updated successfully');
      console.log(" successfully updated User info")
    }
  })
  .catch((err) => {
    res.status(500).send(err);
  });


})

app.get("/deleteAccount/:id",async(req, res)=>{
  const id=req.params.id
 
  const result = await Userlog.deleteOne({ _id: id });

  console.log(`Successfully deleted user: `, result);

  res.clearCookie("access_token",{path:'/'})
  res.status(200).send("userLoggedOut")
  
  
  })



  app.post('/contact', (req, res) => {
    const { name, email, message,phone } = req.body;
  
    const transporter = nodemailer.createTransport({
      service: 'gmail',
     
      auth: {
        user: 'chebaaneismail@gmail.com',
        pass:  process.env.PASSWORD
      }
    });
  
    const mailOptions = {
      from:email ,
      to: "chebaaneismail@gmail.com",
      subject: 'New Contact Form Submission from Blog website',
      text: `Name: ${name}\nPhone: ${phone}\nEmail: ${email}\nMessage: ${message}`
    };
  
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email', error);
        res.status(500).send('Error sending email');
      } else {
        console.log('Email sent successfully');
        res.status(200).send('Email sent successfully');
      }
    });
  });
  
  
  

app.listen(4000, function() {
    console.log("Server started on port 4000");
  });