const Product = require("../models/productModel")
const User = require("../models/userModel")
const Order = require('../models/orderModel');
const Cart = require('../models/cartModel');
const Wallet = require('../models/walletModel');
const { getValidCouponsForUser } = require("./couponController");


const addToCart = async (req, res, next) => {
    try {
        const userId = req.session.user_id;

        // Find or create the user's cart and populate the product details
        let userCart = await Cart.findOne({ user: userId }).populate({
            path: 'items.product',
            model: 'Product'
        });

        if (!userCart) {
            userCart = new Cart({ user: userId, items: [] });
        }

        // Find the product to add to the cart
        const productId = req.params.productId;
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).send('Product not found');
        }

        // Check if the product is already in the cart
        const existingItem = userCart.items.find(item => item.product && item.product.equals(productId));

        if (existingItem) {
            // If the product is already in the cart, update the quantity
            existingItem.quantity += 1;
        } else {
            // If the product is not in the cart, add a new item
            userCart.items.push({ product: productId, quantity: 1 });
        }

        // Calculate the total price of the cart based on the current prices of products
        userCart.totalPrice = userCart.items.reduce((total, item) => {
            const itemOfferPrice = item.product ? (item.product.offerPrice || 0) : 0;
            const itemQuantity = item.quantity || 0;
            return total + (itemOfferPrice * itemQuantity);
        }, 0);


        // Save the changes to the database
        await userCart.save();

        res.redirect('/cart');
    } catch (error) {
        next(error);
    }
};

const removeItem = async (req, res, next) => {
    try {
        const userId = req.session.user_id; // Assuming you have user information stored in req.user

        // Get the user's cart
        const userCart = await Cart.findOne({ user: userId });
        
        if (!userCart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        const productIdToRemove = req.params.productId; // Assuming productId is passed in the request parameters
        
        // Find the index of the item to be removed
        const itemIndex = userCart.items.findIndex(item => item.product.toString() === productIdToRemove);

        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Item not found in the cart' });
        }

        // Remove the item from the cart
        userCart.items.splice(itemIndex, 1);

        // Save the updated cart
        await userCart.save();

        res.redirect('/cart'); 
        
    
    } catch (error) {
        next(error)
    }
}    

const cartLoad = async (req, res, next) => {
    try {
      // Assuming you have the user's ID in the session
      const userId = req.session.user_id;
  
      // Fetch the user's cart data
      const userCart = await Cart.findOne({ user: userId }).populate({
        path: 'items.product',
        model: 'Product'
      });
  
      if (!userCart) {
        return res.render('cart', { userCart: null, validCoupons: [], req });
      }
  
      userCart.items.reverse();
  
      // Calculate total cart value
      const userCartTotal = userCart.items.reduce((total, item) => {
        return total + item.product.price * item.quantity;
      }, 0);
  
      // Fetch valid coupons for the user
      const validCoupons = await getValidCouponsForUser(userId, userCartTotal);
  
      // Render the 'cart' view with userCart and validCoupons data
      res.render('cart', { userCart, validCoupons, req });
    } catch (error) {
      next(error);
    }
  };
const updateQuantity = async (req, res, next) => {
    try {
        const userId = req.session.user_id; // Assuming you have user sessions set up

        // Extract data from the request body
        const { quantity, productId } = req.body;

        // Find the user's cart
        let userCart = await Cart.findOne({ user: userId }).populate({
            path: 'items.product',
            model: 'Product'
        });

        // Perform logic to update the quantity in the cart
        if (userCart) {
            const existingItem = userCart.items.find(item => item.product && item.product.equals(productId));

            if (existingItem) {
                // Check if the product has enough stock
                const productStock = existingItem.product.stock;

                if (quantity > productStock) {
                    return res.json({ success: false, message: 'Not enough stock available for this product' });
                }

                existingItem.quantity = quantity;
            }

            await userCart.save();

            res.json({ success: true, message: 'Quantity updated successfully' });
        } else {
            res.json({ success: false, message: 'Cart not found' });
        }
    } catch (error) {
        next(error);
    }
};
const loadCheckout = async (req, res, next) => {
    try {
        const userId = req.session.user_id;

        // Fetch the user's cart data
        const userCart = await Cart.findOne({ user: userId }).populate({
            path: 'items.product',
            model: 'Product'
        });
         // Fetch the user's wallet balance
         const userWallet = await Wallet.findOne({ userId });
       
        const user = req.session.user;
        const isCartEmpty = !userCart || !userCart.items || userCart.items.length === 0;
        res.render('checkout',{ user ,userCart , userWallet,isCartEmpty});
    } catch (error) {
        next(error);
    }
};





module.exports = { addToCart,cartLoad ,
    removeItem,
    updateQuantity,
    loadCheckout
   }
