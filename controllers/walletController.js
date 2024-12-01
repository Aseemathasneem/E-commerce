const Wallet = require("../models/walletModel")
const Order = require('../models/orderModel');

const loadWallet = async (req, res, next) => {
    try {
        const userId = req.session.user_id; // Adjust this based on your authentication mechanism
        
        
        // Fetch the user's wallet data from the database
        let userWallet = await Wallet.findOne({ userId });

        // Check if the user has a wallet
        if (!userWallet) {
            // If the user doesn't have a wallet, create a new one
            userWallet = new Wallet({ userId, walletAmount: 0 }); // Use the correct field name
            await userWallet.save();
        }

       
       userWallet.transactionHistory.sort((a, b) => b.timestamp - a.timestamp);

        // Render the 'wallet' view and pass the wallet data and order data (if available)
        res.render('wallet', { userWallet});
    } catch (error) {
        next(error);
    }
};


module.exports={
    loadWallet,
    
     }
