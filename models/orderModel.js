const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderID: {
        type: String,
        required: true
      },
    orderDate: {
        type: Date,
        default: Date.now,
    },
   
    totalAmount: {
        type: Number,
        required: true,
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    paymentMethod: {
        type: String,
        enum: ['Online payment','Cash On Delivery','Wallet'],
        required: true,
    },
    status: {
        type: String,
        enum: ['Pending', 'Shipped', 'Delivered', 'Cancelled','Placed'],
        default: 'Pending',
    },
    orderItems: [
        {
            product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
            name: { type: String },
            quantity: { type: Number },
            pricePerItem: { type: Number },
            returnStatus: {
                type: String,
                enum: ['Not Returned', 'Pending', 'Accepted', 'Rejected'],
                default: 'Not Returned',
            },
            returnReason: { type: String }
        },
    ],
    shippingAddress: {
        houseName: { type: String },
        street: { type: String },
        city: { type: String },
        state: { type: String },
        postalcode: { type: String },
        country: { type: String },
    },
   
});


// Indexes for frequent query fields
orderSchema.index({ user_id: 1, status: 1 });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
