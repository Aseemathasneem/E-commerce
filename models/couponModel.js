const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    couponCode: {
        type: String,
        required: true,
        unique: true,
        set: value => value.toUpperCase()
    },
    discountPercentage: {
        type: Number,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    minimumAmount: {
        type: Number,
        required: true
    },
    maximumUses: {
        type: Number,
        required: true
    },
    usedCount: {
        type: Number,
        default: 0 ,
    },
    usersApplied: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // Reference to the User model
    }],
});

module.exports = mongoose.model("Coupon", couponSchema);
