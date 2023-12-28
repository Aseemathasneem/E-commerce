const mongoose = require("mongoose")

const userSchema = mongoose.Schema({
    name :{
        type : String,
        required : true
    },
    email:{
        type :String,
        required :true 
    },
    password:{
        type :String,
        required :true 
    },
    confirm_password: {  
        type: String,
        required: true
    },
    image:{
        type :String,
        required :true 
    },
    mobile:{
        type :String,
        required :true 
    },
    is_verified:{
        type:Number,
        default:0
    },
    is_admin:{
        type:Number,
        default: 0
    },
    is_blocked: {
        type: Boolean,
        default: false
    },
    token:{
        type:String,
        default:''
    },
    address:[{
        house_name:String,
        street:String,
        city:String,
        state:String,
        postalcode:String,
        country:String
    }]
   
})

 module.exports = mongoose.model("User",userSchema)