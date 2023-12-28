const Razorpay = require('razorpay')
const crypto = require('crypto');

const Order = require('../models/orderModel');
var razorpayInstance = new Razorpay({
    key_id: 'rzp_test_v7rw5YVuZNt4LD',
    key_secret: 'DBBlIHiOwK0Gd4UFg9PJ6CsG',
  });

  const loadRazorpay =  async (req, res, next) => {
    try {
        const orderId = req.query.orderId;

        const order = await Order.findById(orderId);

        
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.render('razorpay-payment',{order})
    } catch (error) {
        next(error)
    }
}   
const initiateRazorpayPayment = async (req, res, next) => {
    try {
        
        const orderId = req.body.orderId;
        const totalAmount = req.body.amount; // Retrieve total amount from form submission
        
        
        console.log('total amount is', totalAmount);

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const options = {
            amount: totalAmount *100, // Amount in paise
            currency: 'INR',
            receipt: order._id,
            payment_capture: 1, // Auto capture payment (1 for true, 0 for false)
        };

        // Create an order using Razorpay API
        const razorpayOrder = await razorpayInstance.orders.create(options);
        console.log("Razorpay Response:", razorpayOrder);
        // Send the Razorpay order ID and other details to the client
        
        res.json({
          razorpayOrderId: razorpayOrder.id,
         
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          receipt: razorpayOrder.receipt,
      });
        
    } catch (error) {
        console.error(error);
        next(error);
    }
};
const verifyPayment = async (req, res) => {
  try {
      const { paymentId, orderId, signature, id } = req.body;
      
      const secret = 'DBBlIHiOwK0Gd4UFg9PJ6CsG'
      const generated_signature = crypto.createHmac('sha256', secret)
          .update(orderId + "|" + paymentId)
          .digest('hex');

      if (generated_signature === signature) {
          const update = await Order.findOneAndUpdate(
              { _id: id },
              { $set: { status: 'Placed' } },
              { new: true }
          );
          
          res.status(200).json({ success: true, message: 'Payment verification successful',id  });
      } else {
          res.status(400).json({ error: 'Invalid signature' });
      }
  } catch (error) {
      console.log(error.message);
      res.status(500).json({ error: 'Internal Server Error' });
  }
};

  
  
  


module.exports={loadRazorpay,
    initiateRazorpayPayment ,
    verifyPayment
    
    
}