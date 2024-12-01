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
const cartController = require('../controllers/cartController');
const orderController = require('../controllers/orderController');
const couponController = require('../controllers/couponController');
const paymentController = require('../controllers/paymentController');
const walletController = require('../controllers/walletController');

const bodyParser = require("body-parser");
user_route.use(bodyParser.json());
user_route.use(bodyParser.urlencoded({ extended: true }));

const multer = require("multer");
const path = require("path");
const noCache = require("../middleware/noCache");

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

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
      if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
          return cb(new Error('Only image files are allowed!'));
      }
      cb(null, true);
  }
});
user_route.get('/home',userController.loadHome)

// user_route.get('/user_home',userController.loadHome2)

//Other routes
user_route.get('/register', auth.isLogout, userController.loadRegister);
user_route.post('/register', upload.single('image'), userController.register_user);
user_route.get('/send-otp',userController.loadOTPVerification);
user_route.post('/send-otp', userController.verifyOtp);
user_route.get('/resend-otp', userController.loadResendOTPPage);
user_route.post('/resend-otp', userController.verifyResendOTP);


user_route.get('/login',noCache, auth.isLogout, userController.loginLoad);
user_route.post('/login',noCache,auth.isLogout, userController.verifyLogin);
user_route.get('/logout',noCache,auth.isLogin, userController.userLogout);

user_route.get('/shop',userController.getShopProducts)
// user_route.get('/shopProducts', userController.getShopProducts);
user_route.get('/product-detail/:productId',userController.loadProductDetail)
user_route.get('/cart',auth.isLogin, cartController.cartLoad);
user_route.post('/cart/:productId',auth.isLogin, cartController.addToCart);
user_route.post('/updateQuantity', auth.isLogin, cartController.updateQuantity);
user_route.get('/remove-item/:productId',auth.isLogin, cartController.removeItem);
user_route.post('/apply-coupon', auth.isLogin, couponController.applyCoupon);


user_route.get('/my-profile',auth.isLogin,userController.loadProfile)
user_route.post('/my-profile',auth.isLogin,userController.submitProfile)
user_route.get('/my-profile',auth.isLogin,userController.loadProfile)
user_route.post('/editAddress',auth.isLogin,userController.editAddress)
user_route.get('/deleteAddress',auth.isLogin,userController.deleteAddress)



user_route.get('/checkout',auth.isLogin, cartController.loadCheckout);
user_route.post('/placeOrder',auth.isLogin, orderController.placeOrder)
user_route.get('/order-success',auth.isLogin, orderController.loadOrderSuccess);

user_route.get('/razorpay',auth.isLogin, paymentController.loadRazorpay);
user_route.post('/initiate-payment',auth.isLogin, paymentController.initiateRazorpayPayment);
user_route.post('/verify-payment',auth.isLogin, paymentController.verifyPayment);



user_route.post('/change-password',auth.isLogin,userController.changePassword)

user_route.get('/order-history',auth.isLogin, orderController.loadOrderHistory);
user_route.get('/download-invoice/:orderId',auth.isLogin, orderController.loadInvoice);

user_route.post('/cancel-order/:orderId',auth.isLogin,orderController.cancelOrder)
user_route.get('/order-details/:orderId',auth.isLogin, orderController.loadOrderdetails);
user_route.post('/return-product/:orderId/:itemId',auth.isLogin, orderController.productReturn);

user_route.get('/wallet',auth.isLogin, walletController.loadWallet);




module.exports = user_route;
