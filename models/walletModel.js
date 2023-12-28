const mongoose = require('mongoose');


const walletSchema = new mongoose.Schema({
   userId:{
      type:mongoose.Schema.Types.ObjectId,
      ref:'user',
      required:true,
   },
   walletAmount:{
      type:Number,
      default:0,
      min: 0
   },
   transactionHistory:[{
    timestamp: { type: Date, default: Date.now },
    transactionType: { type: String, required: true }, // e.g., 'deposit', 'withdrawal'
    amount: { type: Number, required: true },
    reason: { type: String }, // e.g., 'refund', 'purchase'
   
 }]
})


module.exports = mongoose.model('Wallet',walletSchema)