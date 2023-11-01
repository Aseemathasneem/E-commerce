const express = require("express");
const user_route = express();
const session = require("express-session");

const config = require("../config/config");
user_route.use(
  session({
    secret: config.sessionSecret,
    resave: true,
    saveUninitialized: true,
  })
);

const auth = require('../middleware/auth');

user_route.set('view engine', 'ejs');
user_route.set('views', './views/user');

const userController = require('../controllers/userController');

const bodyParser = require("body-parser");
user_route.use(bodyParser.json());
user_route.use(bodyParser.urlencoded({ extended: true }));

const multer = require("multer");
const path = require("path");

user_route.use(express.static('public'));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/userimages'));
  },
  filename: function (req, file, cb) {
    const name = Date.now() + '' + file.originalname;
    cb(null, name);
  },
});

const upload = multer({ storage: storage });
user_route.get('/home', auth.isLogin,userController.loadHome)

user_route.get('/home', auth.isLogout,userController.loadHome2)

//Other routes
user_route.get('/register', auth.isLogout, userController.loadRegister);
user_route.post('/register', upload.single('image'), userController.register_user);
user_route.get('/send-otp',userController.loadOTPVerification);
user_route.post('/send-otp', userController.verifyOtp);
user_route.get('/resend-otp', userController.loadResendOTPPage);
user_route.post('/resend-otp', userController.verifyResendOTP);


user_route.get('/login', auth.isLogout, userController.loginLoad);
user_route.post('/login', userController.verifyLogin);
user_route.get('/logout', auth.isLogin, userController.userLogout);

user_route.get('/products/category/:categoryName', userController.fetchProductsByCategory);

module.exports = user_route;
