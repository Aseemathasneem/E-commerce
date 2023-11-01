
const User = require("../models/userModel")
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

    // Generate OTP
    const otpData = generateOtp();

    const user = new User({
      name: req.body.name,
      email: req.body.email,
      password: spassword,
      mobile: req.body.mobile,
      image: req.file.filename,
      is_admin: 0
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

        console.log(updateInfo);

        // Remove the OTP from the OTP store
        delete otpStore[userEmail];
        const message = 'Registration and OTP verification successful!'

        res.render('otp', { id: id, message });
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

        console.log(updateInfo);

        // Remove the OTP from the OTP store
        delete otpStore[userEmail];
        const message = 'Registration and OTP verification successful!'

        res.render('otp', { id: id, message });
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
    const user = req.session.user;
    const allCategories = await Category.find({});
    const products = await Product.find({});
    res.render('index', { user, categories: allCategories, products })
  } catch (error) {
    console.log(error.message)
  }
}
const cropAndUploadImage = async (image) => {
  try {
      const imageFilePath = path.join(__dirname, '../public/userimages', image.filename);
      const croppedImageDir = path.join(__dirname, '../public/userimages');
      const croppedImageName = `cropped_${image.filename}`;
      const croppedImagePath = path.join(croppedImageDir, croppedImageName);

      const sharpImage = sharp(imageFilePath);
      
      const croppedImageBuffer = await sharpImage
          .resize(300, 500)
          .rotate()
          .toBuffer();

      await fs.promises.writeFile(croppedImagePath, croppedImageBuffer);

      return croppedImagePath;
  } catch (error) {
      console.error('Error processing image:', error);
      throw new Error('Image processing failed');
  }
};
const loadHome2 = async (req, res) => {
  try {
      const user = req.session.user;
      const allCategories = await Category.find({});
      const productData = await Product.find();

      if (productData) {
          const imageUrls = [];

          for (const product of productData) {
              try {
                  const productImageUrls = await Promise.all(product.images.map(async (image) => {
                      const croppedImageUrl = await cropAndUploadImage(image);
                      return croppedImageUrl;
                  }));

                  imageUrls.push(productImageUrls);
              } catch (cropError) {
                  console.error('Error cropping images for a product:', cropError);
              }
          }

          res.render("index", {
              products: productData,
              imageUrls: imageUrls,
              user: null,
              categories: allCategories
          });

      } else {
          console.log("No data found");
      }
  } catch (error) {
      console.log(error.message);
      
  }
};

const fetchProductsByCategory = async (req, res) => {
  const { categoryName } = req.params;
  
  try {
      const products = await Product.find({ category: categoryName });

      if (!products || products.length === 0) {
          return res.status(404).json({ message: 'No products found for this category.' });
      }

      res.status(200).json(products);
  } catch (error) {
      res.status(500).json({ message: 'Error fetching products', error: error.message });
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
    const email = req.body.email
    const password = req.body.password

    const userData = await User.findOne({ email: email })

    if (userData) {
      const passwordMatch = await bcryptjs.compare(password, userData.password)
      if (passwordMatch) {
        if (userData.is_verified === 0) {
          res.render('login', { message: 'Please complete otp verification', showOtpButton: true })
        } else {
          req.session.user = userData;
          req.session.user_id = userData._id
          res.redirect('/home')
        }

      } else {
        res.render('login', { message: 'Email and Password are incorrect', showOtpButton: false })
      }

    } else {
      res.render('login', { message: 'Email and Password are incorrect', showOtpButton: false })
    }

  } catch (error) {
    console.log(error.message)

  }
}

const userLogout = async (req, res) => {
  try {
    req.session.destroy()
    res.redirect('/home')
  } catch (error) {
    console.log(error.message)
  }
}


module.exports = {
  loadRegister,
  register_user,
  loginLoad,
  verifyLogin,
  loadHome,
  loadHome2,
  fetchProductsByCategory,
  userLogout,
  loadOTPVerification,
  loadResendOTPPage,
  verifyResendOTP,
  verifyOtp





}
