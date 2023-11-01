const User = require('../models/userModel');
const Product = require("../models/productModel") 
const Category = require("../models/categoryModel") 
const bcryptjs = require('bcryptjs');
const randomstring = require('randomstring')
const config = require('../config/config')
const nodemailer=require('nodemailer')
const securePassword = async(password)=>{
  try {
      const passwordHash = await bcryptjs.hash(password,10)
      return passwordHash
      
  } catch (error) {
      res.status(400).send(error.message)
  }

}


const sendResetPasswordMai = async(name,email,token)=>{
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS:true,
      auth: {
        user: config.emailUser,
        pass: config.emailPassword,
      },
    });
    const mailOptions ={
      from:config.emailUser,
      to:email,
      subject:'for reset password',
      html:'<p>Hii  '+name+', Please click here to <a href="http://127.0.0.1:3000/admin/forget-password?token='+token+'">Reset </a> your password.</p>'

    } 
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log('Email has been sent:', info.response);
      }
    });  
  } catch (error) {
    console.log(error.message)
  }
}


const loadLogin = async (req, res) => {
    try {
      res.render('login');
    } catch (error) {
      console.log(error.message);
    }
  };

  const verifyLogin = async (req, res) => {
    try {
      const email = req.body.email;
      const password = req.body.password;
      const userData = await User.findOne({ email: email });
  
      if (userData) {
        const passwordMatch = await bcryptjs.compare(password, userData.password);
  
        if (passwordMatch) {
          if (userData.is_admin === 0) {
            res.render('login', { message: 'Email and password are incorrect' });
          } else {
            req.session.user_id = userData._id;
            res.redirect('/admin/home');
          }
        } else {
          res.render('login', { message: 'Email and password are incorrect' });
        }
      } else {
        res.render('login', { message: 'Email and password are incorrect' });
      }
    } catch (error) {
      console.log(error.message);
      res.status(500).send('Server Error');
    }
  };
  
  
const loadDashboard = async (req, res) => {
    try {
      // res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      const userData = await User.findById({ _id: req.session.user_id });
      const usersData = await User.find({ is_admin:0 });
      res.render('home', { admin: userData ,users:usersData});
    } catch (error) {
      console.log(error.message);
      res.status(500).send('Server Error');
    }
  };
const logout = async (req, res) => {
    try {
      req.session.destroy();
      res.redirect('/admin');
    } catch (error) {
      console.log(error.message);
      res.status(500).send('Server Error');
    }
};  
 
const forgetLoad = async(req,res)=>{
  try {
    res.render('forget')
  } catch (error) {
    console.log(error.message)
  }
}
const forgetVerify = async(req,res)=>{
  try {
    const email = req.body.email
    
    const userData = await  User.findOne({email:email})
    if(userData){
        if(userData.is_admin===0){
          res.render('forget',{message:'Email is incorrect'})
        }else{
          const randomString = randomstring.generate()
          
          const updatedData = await User.updateOne({email:email},{$set:{token:randomString}})
          sendResetPasswordMai(userData.name,userData.email,randomString)
          res.render('forget',{message:'Please check your mail to reset your password'})
        }
    }else{
       res.render('forget',{message:'Email is incorrect'})
    }


  } catch (error) {
    console.log(error.message)
    
  }
}
const forgetPasswordLoad= async(req,res)=>{
  try {
    const token = req.query.token
    

  const tokenData = await User.findOne({token:token})
  
  if (tokenData) {
    res.render('forget-password',{user_id:tokenData._id})
  } else {
    res.render('404',{message:'Invalid link'})
  }
  } catch (error) {
    console.log(error.message)
  }
}
const resetPassword = async(req,res)=>{
  try {
    const password = req.body.password
    
    const user_id = req.body.user_id
    
    
    const securePass = await securePassword(password)

    const updatedData = await User.findByIdAndUpdate({_id:user_id},{$set:{password:securePass,token:''}})
    res.redirect('/admin')
  } catch (error) {
    console.log(error.message)
  }
}
const loadProducts =  async(req,res)=>{
  try {
    const allCategories = await Category.find({});
    res.render('products',{category:allCategories})
  } catch (error) {
    console.log(error.message)
  }
}

const submitProducts = async(req,res)=>{
  
  try {
    
    
    const imagePaths=req.files.map(file=>file.path)
    const product = new Product({
      name: req.body.name,
      category: req.body.category,
      price: req.body.price,
      offerPrice: req.body.offerPrice,
      stock: req.body.stock,
      description: req.body.description,
      images: imagePaths
      
    });
    const allCategories = await Category.find({});
    const savedProduct = await product.save();
    if (savedProduct) {
      res.render('products', { message: 'Product added successfully!',category:allCategories});
    } else {
      res.render('products', { message: 'Something went wrong!' ,category:allCategories});
    }
  } catch (error) {
    console.log(error.message)
    res.status(500).send('Error saving the product')
  }

}

const loadCategory = async(req,res)=>{
  try {
   
 

    res.render('category1')
  } catch (error) {
    console.log(error.message)
  }
}
const submitCategory = async(req,res)=>{
  try {
    const categoryName = req.body.category;
    const newCategory = new Category({
      categoryName: categoryName
  });

   await newCategory.save();
   const allCategories = await Category.find({});
   

   res.render('category', {category:allCategories});

    
  } catch (error) {
    console.log(error.message)
  }
}



  module.exports={
    loadLogin ,
    verifyLogin,
    loadDashboard,
    logout,
    forgetLoad,
    forgetVerify,
    forgetPasswordLoad,
    resetPassword,
    loadProducts,
    submitProducts,
    loadCategory,
    submitCategory

  }