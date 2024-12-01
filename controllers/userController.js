const path = require("path");
const Jimp = require('jimp');

const fs = require('fs').promises;
const User = require("../models/userModel")
const Banner = require("../models/bannerModel")
const Product = require("../models/productModel")
const Category = require("../models/categoryModel")
const bcryptjs = require("bcryptjs")
const nodemailer = require("nodemailer")
const otpGenerator = require('otp-generator')


const securePassword = async (password) => {
  try {
    const passwordHash = await bcryptjs.hash(password, 10)
    return passwordHash

  } catch (error) {
    res.status(400).send(error.message)
  }

}
let otpStore = {};
const generateOtp = () => {
  const OTP = otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    specialChars: false,
  });
  const expDate = Date.now() + 5 * 60 * 1000; // OTP expires in 10 minutes (adjust the duration as needed)
  return { otp: OTP, expDate };
};

const sendVerifyMail = async (name, email, otp) => {
  try {

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'aseemathasneem@gmail.com',
        pass: 'wuyb zied oajr ygjt',
      },
    });

    const mailOptions = {
      from: 'aseemathasneem@gmail.com',
      to: email,
      subject: 'OTP Verification',
      html: `<p>Hii ${name}, Your OTP is: ${otp}</p>`,



    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log('Email has been sent:', info.response);
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};



const loadRegister = async (req, res) => {
  try {
    res.render('register')
  } catch (error) {
    console.log(error.message)
  }
}



const register_user = async (req, res) => {
  try {
    const spassword = await securePassword(req.body.password);
    if (req.body.password !== req.body.confirm_password) {
      return res.render('register', { message1: 'Passwords do not match!!' });
    }
    // Generate OTP
    const otpData = generateOtp();

    const user = new User({
      name: req.body.name,
      email: req.body.email,
      password: spassword,
      mobile: req.body.mobile,
      image: req.file.filename,
      is_admin: 0,
      confirm_password: req.body.confirm_password
    });
    const userData = await User.findOne({ email: req.body.email });

    if (userData) {
      res.render('register', { message1: 'This email already exists!' });
    } else {
      const userData = await user.save();
      if (userData) {
        otpStore[req.body.email] = otpData

        sendVerifyMail(req.body.name, req.body.email, otpData.otp);
        res.redirect(`/send-otp?id=${userData._id}`); // Redirect to the OTP verification page

      } else {
        res.render('register', { message2: 'Your registration has been failed!' });
      }
    }
  } catch (error) {
    res.status(400).send(error.message);
  }
};


const verifyOtp = async (req, res) => {
  try {
    const id = req.body.id;
    const user = await User.findOne({ _id: id });
    const userEmail = user.email;
    const enteredOtp = req.body.otp;
    const storedOtp = otpStore[userEmail];
    if (storedOtp && Date.now() <= storedOtp.expDate) {
      if (enteredOtp === storedOtp.otp) {

        const updateInfo = await User.updateOne({ email: userEmail }, { $set: { is_verified: 1 } });

        req.session.user = user;
        req.session.user_id = user._id;


        // Remove the OTP from the OTP store
        delete otpStore[userEmail];
        return res.redirect('/home');
       
        
      } else {
        const message = 'OTP Invalid';
        res.render('otp', { id: id, userEmail, message });
      }
    } else if (!storedOtp) {
      const message = 'OTP not found. Please resend OTP.';
      res.render('otp', { id: id, userEmail, message });
    } else {
      const message = 'OTP has expired';
      res.render('otp', { id: id, userEmail, message });
    }
  } catch (error) {
    console.log(error.message);
  }
};
const loadOTPVerification = async (req, res, userEmail) => {
  try {
    const id = req.query.id
    res.render('otp', { id: id })
  } catch (error) {
    console.log(error.message)
  }
}
const loadResendOTPPage = async (req, res) => {
  try {
    const id = req.query.id
    const user = await User.findOne({ _id: id })
    const userEmail = user.email;
    const name = user.name
    const newOtpData = generateOtp();
    otpStore[userEmail] = newOtpData
    sendVerifyMail(name, userEmail, newOtpData.otp);
    const message = 'OTP resent successfully, Please check your email';

    // Render the 'otp' view and pass the message as a variabl
    res.render('resendotp', { id: id, message });
  } catch (error) {
    console.log(error.message);
  }
};
const verifyResendOTP = async (req, res) => {
  try {
    const id = req.body.id;
    const user = await User.findOne({ _id: id });
    const userEmail = user.email;
    const enteredOtp = req.body.otp;
    const storedOtp = otpStore[userEmail];
    console.log(storedOtp)
    if (storedOtp && Date.now() <= storedOtp.expDate) {
      if (enteredOtp === storedOtp.otp) {

        const updateInfo = await User.updateOne({ email: userEmail }, { $set: { is_verified: 1 } });
        req.session.user = user;
        req.session.user_id = user._id;
       

        // Remove the OTP from the OTP store
        delete otpStore[userEmail];
        return res.redirect('/home');
       
      } else {
        const message = 'OTP Invalid';
        res.render('otp', { id: id, userEmail, message });
      }
    } else if (!storedOtp) {
      const message = 'OTP not found. Please resend OTP.';
      res.render('otp', { id: id, userEmail, message });
    } else {
      const message = 'OTP has expired';
      res.render('otp', { id: id, userEmail, message });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loadHome = async (req, res) => {
  try {
    const user = req.session.user; // Get the logged-in user from session
    const allCategories = await Category.find({}); // Fetch all categories
    const productData = await Product.find(); // Fetch all products

    if (productData) {
      // Directly map the first image or set null if no images exist
      const imageUrls = productData.map((product) => {
        if (product.images && product.images.length > 0) {
          // Use the first image from the images array
          return `/productimages/${product.images[0]}`;
        } else {
          return null; // No image available
        }
      });

      // Fetch banners and sort by sequence
      const allBanners = await Banner.find().sort('sequence');

      // Render the index page with the fetched data
      res.render("index", {
        products: productData,
        imageUrls: imageUrls, // Array of image paths
        user, // User data from session
        categories: allCategories, // List of categories
        banners: allBanners, // Sorted banners
      });
    } else {
      console.log("No product data found.");
      res.render("index", {
        products: [],
        imageUrls: [],
        user,
        categories: allCategories,
        banners: [],
      });
    }
  } catch (error) {
    console.error("Error loading home page:", error.message);
    res.status(500).send("An error occurred while loading the page.");
  }
};
const getShopProducts = async (req, res) => {
  const PAGE_SIZE = 6; // Number of products per page
  const page = parseInt(req.query.page) || 1; // Current page
  const searchQuery = req.query.q || ""; // Search keyword
  const categoryName = req.query.category || ""; // Category filter
  const sortOption = req.query.SortBy || "title-ascending"; // Sorting option

  try {
    const allCategories = await Category.find({});
    let query = {};
    let message = ""; // Initialize message variable

    // Apply category filter
    if (categoryName) {
      query.category = categoryName;
    }

    // Validate search query length
    if (searchQuery && searchQuery.length < 2) {
      message = "Please enter at least 2 characters for the search.";
    } else if (searchQuery) {
      query.$or = [
        { name: { $regex: searchQuery, $options: "i" } },
        { description: { $regex: searchQuery, $options: "i" } },
      ];
    }

    // Determine sort criteria
    const sortCriteria = {};
    if (sortOption === "price-ascending") {
      sortCriteria.price = 1; // Ascending order
    } else if (sortOption === "price-descending") {
      sortCriteria.price = -1; // Descending order
    }

    // Count total products for pagination
    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / PAGE_SIZE);

    // Fetch products based on filters, search, and sorting
    const products = await Product.find(query)
      .sort(sortCriteria)
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE);

    // Render the results
    res.render("shop", {
      products: products,
      categories: allCategories,
      totalPages: totalPages,
      currentPage: page,
      searchQuery: searchQuery,
      currentCategory: categoryName,
      sortOption: sortOption,
      message: message, // Pass message to the template
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching products");
  }
};





//login user methods
const loginLoad = async (req, res) => {
  try {
    res.render('login', { showOtpButton: false })
  } catch (error) {
    console.log(error.message)
  }
}
const verifyLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const userData = await User.findOne({ email: email });

    if (userData) {
     
      if (userData.is_blocked) {
        return res.render('login', { message: 'You have been blocked by the admin', showOtpButton: false });
      }
      const passwordMatch = await bcryptjs.compare(password, userData.password);
      if (passwordMatch) {
        if (userData.is_verified === 0) {
          res.render('login', { message: 'Please complete otp verification', showOtpButton: true });
        } else {
          req.session.user = userData; // Set the user data in session
          req.session.user_id = userData._id;
          res.redirect('/home');
        }
      } else {
        res.render('login', { message: 'Email and Password are incorrect', showOtpButton: false });
      }
    } else {
      res.render('login', { message: 'Email and Password are incorrect', showOtpButton: false });
    }
  } catch (error) {
    console.log(error.message)
  }
};


const userLogout = async (req, res) => {
  try {
    req.session.destroy()
    res.redirect('/home')
  } catch (error) {
    console.log(error.message)
  }
}


const loadShop = async (req, res) => {
  const PAGE_SIZE = 6; // Number of products per page
  const page = parseInt(req.query.page) || 1; // Get the requested page, default to 1
  const sortOption = req.query.SortBy || 'title-ascending'; // Default to some default sorting option if not provided


  try {
    const totalProducts = await Product.countDocuments();
    const totalPages = Math.ceil(totalProducts / PAGE_SIZE);

    const productData = await Product.find()
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .exec();

    const allCategories = await Category.find({});

    if (productData) {
      const imageUrls = []; // Ensure this is adapted to fit pagination

      // Your image processing logic should consider paginated products

      res.render("shop", {
        products: productData,
        imageUrls: imageUrls,
        categories: allCategories,
        totalPages: totalPages,
        currentPage: page,
        sortOption
      });

    } else {
      console.log("No data found");
    }
  } catch (error) {
    console.log(error.message);
  }
};






const loadProductDetail = async (req, res) => {
    try {
        const productId = req.params.productId;

        // Retrieve the product details based on the productId
        const product = await Product.findById(productId);

        if (product) {
            res.render('product-detail', { product,baseURL: 'http://localhost:3000/' });
           
        } else {
            
            res.status(404).send('Product not found');
        }
    } catch (error) {
        // Error handling for fetching product details
        console.error(error);
        res.status(500).send('Error fetching product details');
    }
};
const loadProfile = async (req, res) => {
  try {
    const userFromSession = req.session.user;
    if (!userFromSession) {
      // Redirect to a login page or handle unauthorized access
      return res.redirect('/login');
    }
    const address = userFromSession.address;
    res.render('profile',{ user: userFromSession,address} )
  } catch (error) {
   next(error)
  }
}

const submitProfile = async (req, res, next) => {
  try {
    const userId = req.session.user_id; // Assuming you have the user's ID in the session
    const user = await User.findById(userId);

    if (!user) {
      // Handle the case where the user is not found
      return res.status(404).send('User not found');
    }

    // Update the user's address fields
    const newAddress = {
      house_name: req.body.customer.address.house_name,
      street: req.body.customer.address.street,
      city: req.body.customer.address.city,
      state: req.body.customer.address.state,
      postalcode: req.body.customer.address.postal_code,
      country: req.body.customer.address.country
    };
    
    user.address.push(newAddress);
    // Save the updated user to the database
    await user.save();
    req.session.user = await User.findById(userId); 
    res.redirect('/my-profile');
  } catch (error) {
    next(error);
  }
};
const editAddress = async (req, res, next) => {
  try {
      const userId = req.body.user_id;
      const addressId = req.body.address_id;
      const updatedAddress = {
          house_name: req.body.house_name,
          street: req.body.street,
          city: req.body.city,
          state: req.body.state,
          postalcode: req.body.postalcode,
          country: req.body.country
      };

      // Assuming you have a User model with an 'address' array
      const user = await User.findById(userId);

      if (!user) {
          return res.status(404).json({ error: 'User not found' });
      }

      // Find the index of the address in the 'address' array
      const addressIndex = user.address.findIndex(addr => addr._id.toString() === addressId);

      if (addressIndex === -1) {
          return res.status(404).json({ error: 'Address not found' });
      }
     
      // Update the address in the 'address' array
      user.address[addressIndex] = updatedAddress;

      // Save the updated user model
      await user.save();
      req.session.user = await User.findById(userId); 
      
      res.redirect('/my-profile')
  } catch (error) {
      next(error);
  }
};


// Define the deleteAddress controller function
const deleteAddress = async (req, res, next) => {
    try {
        const userId = req.query.user_id; // Extract user ID from the query parameters
        const addressId = req.query.address_id; // Extract address ID from the query parameters

        // Find the user by ID
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Remove the address with the given ID from the user's addresses
        user.address = user.address.filter((address) => address._id.toString() !== addressId);

        // Save the updated user
        await user.save();
        req.session.user = await User.findById(userId); 
        // Redirect or respond based on your application's needs
        res.redirect('/my-profile');
    } catch (error) {
        // Handle errors appropriately
        next(error);
    }
};




const changePassword= async (req, res) => {
  try {
    
    const currentPassword = req.body.currentPassword;
    const newPassword = req.body.newPassword;
   
    const userId = req.session.user_id;

    if (!userId) {
      return res.status(401).send('User not authenticated');
    }
    // Fetch the user from the database
    const user = await User.findById(userId);
   

    if (!user) {
      return res.status(404).send('User not found');
    }

    // Verify the current password
    const isPasswordValid = await bcryptjs.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      return res.status(401).send('Invalid current password');
    }

    // Hash and update the new password
    const newPasswordHash = await securePassword(newPassword);
    user.password = newPasswordHash;
    await user.save();

    res.redirect('/my-profile?passwordChanged=true');
  } catch (error) {
    console.error(error);
    res.status(500).send(`Internal Server Error: ${error.message}`);
  }
}









module.exports = {
  loadRegister,
  register_user,
  loginLoad,
  loadHome,
  verifyLogin,
  userLogout,
  loadOTPVerification,
  loadResendOTPPage,
  verifyResendOTP,
  verifyOtp,
  loadShop,
  getShopProducts,
  loadProductDetail,
  loadProfile,
  submitProfile,
  changePassword,
  editAddress,
  deleteAddress
 





}
