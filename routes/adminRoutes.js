const express =require("express")
const admin_route = express()
const config = require("../config/config")
const session = require("express-session")
const bodyparser = require('body-parser')
const multer = require("multer");
const path = require("path");

admin_route.use(
    session({
      secret: config.sessionSecret,
      resave: true, // Add this line
      saveUninitialized: true, // Add this line
    })
  );



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

const upload = multer({ storage: storage });





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

admin_route.get('/add-products',adminController.loadProducts)
admin_route.post('/add-products',upload.array('images', 5),adminController.submitProducts) 

admin_route.get('/add-category',adminController.loadCategory)
admin_route.post('/add-category',adminController.submitCategory)
  




admin_route.get('*',function(req,res){
    res.redirect('/admin')
})

module.exports = admin_route;