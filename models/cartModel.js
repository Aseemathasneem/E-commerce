const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // Reference to the User model
    },
    items: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product' // Reference to the Product model
            },
            quantity: {
                type: Number,
                default: 1 // Default quantity
            }
        }
    ]
});

module.exports = mongoose.model("Cart", cartSchema);
