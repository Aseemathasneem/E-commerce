const  mongoose  = require("mongoose");
mongoose.connect("mongodb://127.0.0.1:27017/e-commerce")

const express = require("express")
const app = express();
//user routes
const user_routes = require("./routes/userRoutes")
app.use('/',user_routes)
//admin routes
const admin_routes = require("./routes/adminRoutes")
app.use('/admin',admin_routes)

app.listen(3000,function(){
    console.log("server is ready")
});
