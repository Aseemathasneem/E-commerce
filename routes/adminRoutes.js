const express =require("express")
const admin_route = express()
const config = require("../config/config")
const session = require("express-session")
const bodyparser = require('body-parser')
const multer = require("multer");
const path = require("path");

const categoryController = require('../controllers/categoryController')
const productController = require('../controllers/productController')
const orderController = require('../controllers/orderController');
const couponController = require('../controllers/couponController');
const bannerController = require('../controllers/bannerController');



admin_route.use(
    session({
      secret: config.sessionSecret,
      resave: true, // Add this line
      saveUninitialized: true, // Add this line
    })
  );


admin_route.use(express.static('public'));

admin_route.use(bodyparser.json())
admin_route.use(bodyparser.urlencoded({extended:true}))  
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/productimages'));
  },
  filename: function (req, file, cb) {
    const name = Date.now() + '-' + file.originalname;
    cb(null, name);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
      if (!file.originalname.match(/\.(jpg|jpeg|png|webp)$/)) {
          return cb(new Error('Only image files are allowed!'));
      }
      cb(null, true);
  }
});







admin_route.set('view engine','ejs')
admin_route.set('views','./views/admin')

const auth =require('../middleware/adminAuth')
const adminController = require('../controllers/adminController')


admin_route.get('/',auth.isLogout,adminController.loadLogin)
admin_route.post('/',adminController.verifyLogin)

admin_route.get('/home',auth.isLogin,adminController.loadDashboard)
admin_route.get('/logout',auth.isLogin,adminController.logout)

admin_route.get('/forget',auth.isLogout,adminController.forgetLoad)
admin_route.post('/forget',adminController.forgetVerify)


admin_route.get('/forget-password',auth.isLogout,adminController.forgetPasswordLoad)
admin_route.post('/forget-password',adminController.resetPassword)

admin_route.get('/users',auth.isLogin,adminController.loadUsers)
admin_route.get('/userOrders',auth.isLogin,adminController.userOrders)

admin_route.get('/sales-report',auth.isLogin,adminController.loadReportForm);
admin_route.post('/generate-report',auth.isLogin,adminController.generateReport);
admin_route.get('/sales-report-pdf',auth.isLogin,adminController.salesReportPdf);
admin_route.get('/sales-report-excel',auth.isLogin,adminController.salesReportExcel);





admin_route.get('/blockUser',auth.isLogin, adminController.blockUser);


admin_route.get('/add-products',auth.isLogin,productController.loadProducts)
admin_route.post('/add-products',auth.isLogin,upload.array('images', 5),productController.submitProducts) 
admin_route.get('/product-list',auth.isLogin,productController.loadProductsList)
admin_route.get('/product-delete',auth.isLogin,productController.deleteProduct)
admin_route.get('/product-edit',auth.isLogin,productController.loadEditProduct)
admin_route.post('/product-edit',auth.isLogin,upload.array('images', 5),productController.editProduct)


admin_route.get('/category-list',auth.isLogin,categoryController.loadCategory)
admin_route.get('/add-category',auth.isLogin,categoryController.loadAddCategory)
admin_route.post('/add-category',auth.isLogin,categoryController.submitCategory)
admin_route.get('/category-delete',auth.isLogin,categoryController.deleteCategory)
admin_route.get('/category-edit',auth.isLogin,categoryController.loadEditCategory)
admin_route.post('/category-edit',auth.isLogin,categoryController.editCategory)
admin_route.post('/add-category',auth.isLogin,categoryController.submitCategory)

admin_route.get('/orders',auth.isLogin,orderController.loadOrders)
admin_route.post('/edit-order/:orderId',auth.isLogin,orderController.editStatus)
admin_route.get('/order-details/:orderId',auth.isLogin,orderController.adminOrderDetails)
admin_route.post('/edit-product-return/:orderId/:itemId',auth.isLogin,orderController.editProductReturn)

admin_route.get('/add-coupon',auth.isLogin,couponController.loadAddCoupon)
admin_route.post('/add-coupon',auth.isLogin,couponController.addCoupon)

admin_route.get('/view-coupon',auth.isLogin,couponController.viewCoupon)
admin_route.get('/coupon-delete',auth.isLogin,couponController.deleteCoupon)
admin_route.get('/coupon-edit',auth.isLogin,couponController.loadEditCoupon)
admin_route.post('/coupon-edit',auth.isLogin,couponController.EditCoupon)

admin_route.get('/add-banner',auth.isLogin,bannerController.loadAddbanner)
admin_route.post('/add-banner',auth.isLogin, upload.single('image'),bannerController.addBanner)
admin_route.get('/view-banners',auth.isLogin,bannerController.viewBanner)
admin_route.get('/banner-delete',auth.isLogin,bannerController.deleteBanner)
admin_route.get('/banner-edit',auth.isLogin,bannerController.loadEditbanner)
admin_route.post('/banner-edit',auth.isLogin, upload.single('image'),bannerController.editBanner)










  




admin_route.get('*',function(req,res){
    res.redirect('/admin')
})

module.exports = admin_route;