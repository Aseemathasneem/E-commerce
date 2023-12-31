const easyinvoice = require('easyinvoice');
const fs = require('fs').promises; // Use fs.promises for asynchronous file writing
const path = require('path');
const Product = require("../models/productModel")
const User = require("../models/userModel")
const Order = require('../models/orderModel');
const Cart = require('../models/cartModel');
const Wallet = require('../models/walletModel');



function generateRandomOrderId(length) {
    const prefix = 'ORD';
    const characters = '0123456789';
    let orderId = prefix;

    // Ensure the total length, including the prefix, is equal to the specified length
    for (let i = 0; i < length - prefix.length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        orderId += characters.charAt(randomIndex);
    }

    return orderId;
}

const placeOrder = async (req, res) => {
    let newOrder; // Move the declaration here
    try {
        const userId = req.session.user_id;
        const newGrandTotal = req.body.newGrandTotal;

        // Fetch the user's wallet balance
        const userWallet = await Wallet.findOne({ userId });

        // Populate the user model to access the user's address array
        const user = await User.findById(userId).populate('address');

        // Assuming you have a 'Cart' model for the user's cart
        const userCart = await Cart.findOne({ user: userId }).populate({
            path: 'items.product',
            model: 'Product'
        });

        // Use newGrandTotal directly if available; otherwise, use the sum of cart items
        const totalAmount = newGrandTotal
            ? parseFloat(newGrandTotal)
            : userCart.items.reduce((total, item) => {
                return total + (item.product.offerPrice || 0) * item.quantity;
            }, 0);

        // Create a new order
        const orderItems = userCart.items.map((item) => ({
            product: item.product._id,
            name: item.product.name,
            quantity: item.quantity,
            pricePerItem: item.product.offerPrice || item.product.price,
        }));

        // Update the stock for each item in the order
        for (const item of orderItems) {
            const product = await Product.findById(item.product);
            if (product) {
                product.stock -= item.quantity;
                await product.save();
            }
        }

        // Assuming the selected address index is sent in the request body
        const selectedAddressIndex = req.body.selectedAddress;

        // Retrieve the selected address from the user's addresses array
        const selectedAddress = user ? user.address[selectedAddressIndex] : null;

        if (req.body.paymentMethod === 'Wallet') {
            // If payment method is Wallet, check if wallet balance is sufficient
            if (userWallet && userWallet.walletAmount >= totalAmount) {
                // Wallet balance is sufficient, complete the order with Wallet as the payment method
                newOrder = new Order({
                    orderID: generateRandomOrderId(6),
                    user_id: userId,
                    totalAmount: totalAmount,
                    paymentMethod: 'Wallet',
                    orderItems: orderItems,
                    shippingAddress: selectedAddress,
                    status: 'Placed',
                });

                // Save the order to the database
                await newOrder.save();

                // Update the wallet balance
                userWallet.walletAmount -= totalAmount;
                userWallet.transactionHistory.push({
                    timestamp: Date.now(),
                    transactionType: 'debit',
                    amount: totalAmount,
                    reason :'purchase',
                });
                await userWallet.save();

                // Clear the user's cart
                userCart.items = [];
                await userCart.save();

                // Redirect to the order success page
                res.redirect(`/order-success?orderId=${newOrder._id}`);
            } else {
            const errorMessage = encodeURIComponent(`Insufficient wallet balance`);
            return res.redirect(`/checkout?errorMessage=${errorMessage}`);
            }
        } else if (req.body.paymentMethod === 'Cash On Delivery') {
            // If payment method is Cash On Delivery, render order-success page
            newOrder = new Order({
                orderID: generateRandomOrderId(6),
                user_id: userId,
                totalAmount: totalAmount,
                paymentMethod: 'Cash On Delivery',
                orderItems: orderItems,
                shippingAddress: selectedAddress,
            });

            await newOrder.save();

            // Clear the user's cart
            userCart.items = [];
            await userCart.save();

            res.redirect(`/order-success?orderId=${newOrder._id}`);
        } else {
            // For other payment methods, redirect to the /razorpay page
            newOrder = new Order({
                orderID: generateRandomOrderId(6),
                user_id: userId,
                totalAmount: totalAmount,
                paymentMethod: 'Online payment', // Replace with your logic
                orderItems: orderItems,
                shippingAddress: selectedAddress,
            });

            await newOrder.save();

            // Clear the user's cart
            userCart.items = [];
            await userCart.save();

            res.redirect(`/razorpay?orderId=${newOrder._id}`);
        }
    } catch (error) {
        console.log(error.message);
    }
};


const loadOrderSuccess = async (req, res, next) => {
    try {
        const orderId = req.query.orderId;
        console.log('order id', orderId)
        res.render('order-success', { orderId })
    } catch (error) {
        next(error);
    }
}



const loadOrderHistory = async (req, res, next) => {
    try {
        // Assuming you have the user's ID in the session
        const userId = req.session.user_id;

        // Fetch order history for the user from the database
        const orders = await Order.find({ user_id: userId }).sort({ orderDate: -1 });

        // Render the order history page and pass the orders data to it
        res.render('orderHistory', { orders });
    } catch (error) {
        next(error);
    }
};
const productReturn = async (req, res, next) => {
    try {
        const orderId = req.params.orderId;
        const itemId = req.params.itemId;
        const returnReason = req.body.returnReason; // Get return reason from the form
        const additionalComments = req.body.additionalComments; // Get additional comments from the form

        const order = await Order.findById(orderId);

        // Check if the order status is 'Delivered'
        if (order.status !== 'Delivered') {
            const errorMessage = encodeURIComponent(`Product return is only allowed for delivered orders`);
            return res.redirect(`/order-details/${orderId}?errorMessage=${errorMessage}`);
        }

        const orderItem = order.orderItems.find(item => item._id.toString() === itemId);

        // Update the return status and return reason
        orderItem.returnStatus = 'Pending';
        orderItem.returnReason = returnReason;

        // Save the updated order
        await order.save();

       

        // Redirect to the order details page
        res.redirect(`/order-details/${orderId}`);
    } catch (error) {
        next(error);
    }
};
const editProductReturn = async (req, res, next) => {
    try {
        const orderId = req.params.orderId;
        const itemId = req.params.itemId;
        const newReturnStatus = req.body.newReturnStatus; // Get new return status from the form

        const order = await Order.findById(orderId);

        // Find the order item to edit
        const orderItem = order.orderItems.find(item => item._id.toString() === itemId);

        // Update the return status based on the admin's choice
        orderItem.returnStatus = newReturnStatus;

        // Check if the return status is 'Accepted' to process the refund
        if (newReturnStatus === 'Accepted') {
            // Retrieve user information
            const userId = order.user_id;
            const userWallet = await Wallet.findOne({ userId });

            if (!userWallet) {
                console.error("User's wallet not found.");
                return res.status(500).send("User's wallet not found");
            }

            // Calculate refund amount
            const refundAmount = orderItem.pricePerItem * orderItem.quantity;

            // Refund the amount to the user's wallet
            userWallet.walletAmount += refundAmount;

            // Save the transaction history
            userWallet.transactionHistory.push({
                timestamp: new Date(),
                transactionType: 'credit', // You may want to use 'credit' or 'debit'
                amount: refundAmount,
                reason :'Product return'
            });
            // Update product stock based on return status
            if (orderItem.returnReason !== 'Defective product') {
                const product = await Product.findById(orderItem.product);
                product.stock += orderItem.quantity;
                await product.save();
            }

            await userWallet.save();
        }

        // Save the updated order
        await order.save();

        // Redirect to the order details page or admin dashboard as needed
        res.redirect(`/admin/order-details/${orderId}`);
        
    } catch (error) {
        next(error);
    }
};



const cancelOrder = async (req, res, next) => {
    try {
        const orderId = req.params.orderId;

        // Fetch the order to check its current status
        const orderToCancel = await Order.findById(orderId);

        if (!orderToCancel) {
            // Handle the case where the order with the specified ID was not found
            return res.status(404).send('Order not found');
        }

        // Check if the order is already shipped or delivered
        if (orderToCancel.status === 'Shipped' || orderToCancel.status === 'Delivered') {
            const errorMessage = encodeURIComponent(`Order cannot be cancelled. Already '${orderToCancel.status}'`);
            return res.redirect(`/order-history?errorMessage=${errorMessage}`);
        }
        // Fetch the user associated with the order
        const userId = orderToCancel.user_id;

        // Update the order status to "Cancelled" in the database
        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            { $set: { status: 'Cancelled' } },
            { new: true } // Return the updated document
        );

        // Restock the products
        for (const orderItem of orderToCancel.orderItems) {
            const productId = orderItem.product._id;
            const quantityToRestock = orderItem.quantity;

            // Increment the product stock by the cancelled quantity
            await Product.findByIdAndUpdate(
                productId,
                { $inc: { stock: quantityToRestock } },
                { new: true } // Return the updated document
            );
        }

        // Fetch the user's wallet
        const userWallet = await Wallet.findOne({ userId });
        if (!userWallet) {
            console.error("User's wallet not found.");

            return res.status(500).send("User's wallet not found");
        }
        // Refund the amount to the user's wallet
        const refundAmount = orderToCancel.totalAmount; // Adjust based on your order model
        userWallet.walletAmount += refundAmount;

        // Save the transaction history
        userWallet.transactionHistory.push({
            timestamp: new Date(),
            transactionType: 'credit', // You may want to use 'credit' or 'debit'
            amount: refundAmount,
            reason: 'Cancel order',
        });

        await userWallet.save();



        // Redirect to the order history page
        res.redirect('/order-history');
    } catch (error) {
        next(error);
    }
};

const loadOrderdetails = async (req, res, next) => {
    try {
        const orderId = req.params.orderId;
        const order = await Order.findById(orderId).populate({
            path: 'orderItems.product',
            model: 'Product',
        })
            .exec();;

        if (!order) {
            // Handle the case where the order with the specified ID was not found
            return res.status(404).send('Order not found');
        }

        res.render('orderDetails', { order })
    } catch (error) {
        next(error);
    }
};
const loadOrders = async (req, res, next) => {
    try {
        const orders = await Order.find().populate('user_id').sort({ orderDate: -1 });
        res.render('orders', { orders })
    } catch (error) {
        next(error);
    }
};
const editStatus = async (req, res, next) => {
    try {
        const orderId = req.params.orderId;
        const newStatus = req.body.newStatus;
        const updatedOrder = await Order.findOneAndUpdate(
            { _id: orderId },
            { $set: { status: newStatus } },
            { new: true } // Return the updated document
        ).exec();

        if (!updatedOrder) {
            // Handle the case where the order was not found
            return res.status(404).send('Order not found');
        }

        res.redirect('/admin/orders');
    } catch (error) {
        next(error);
    }
};
const adminOrderDetails = async (req, res, next) => {
    try {
        const orderId = req.params.orderId;


        const order = await Order.findById(orderId)
            .populate('user_id')
            .populate({
                path: 'orderItems.product',
                model: 'Product',
            })
            .exec();

        if (!order) {

            return res.status(404).send('Order not found');
        }
        console.log('Order Details:', order);


        res.render('order-details', { order });
    } catch (error) {
        next(error);
    }
};

const readTemplateFromFile = async () => {
    const templatePath = path.join(__dirname, '../public/invoice.html');
    return await fs.readFile(templatePath, 'utf-8');
};

const loadInvoice = async (req, res, next) => {
    try {
        const orderId = req.params.orderId;
        console.log('invoice order id', orderId)
        const userId = req.session.user_id; // Use req.session.user_id

        const order = await Order.findOne({ _id: orderId, user_id: userId }).populate('orderItems.product');

        if (!order) {
            return res.status(404).send('Order not found');
        }
        const customTemplate = await readTemplateFromFile();
        //invoice data
        const data = {
            customize: {
                template: Buffer.from(customTemplate).toString('base64')
            },
            images: {
                background: "",
            },
            sender: {
                company: "Kid Zone",
                address: "Bangalore GK nagar 432",
                city: "Bangalore",
                country: "India",
            },
            client: {
                company: "Customer Address",
                "zip": `${order.shippingAddress.state}`,
                "city": `${order.shippingAddress.country}`,
                "address": `${order.shippingAddress.street},${order.shippingAddress.city},${order.shippingAddress.postalcode}`
            },
            information: {
                number: order.orderID,
                date: order.orderDate.toISOString().split('T')[0],
            },
            products: order.orderItems.map(item => ({
                description: item.product.name,
                quantity: item.quantity,
                price: item.pricePerItem,
            })),
            total: order.totalAmount.toFixed(2),
            // Omitting tax property to exclude VAT
            tax: [],
            "bottom-notice": "Thanks for shopping with Kid zone.",
        };

        // Generate the invoice PDF
        const result = await easyinvoice.createInvoice(data);

        // Decode the base64 string to binary data
        const binaryData = Buffer.from(result.pdf, 'base64');

        const fileName = `invoice_${orderId}.pdf`;
        const filePath = path.join(__dirname, '../public/invoices', fileName);

        // Save the PDF file using fs.promises.writeFile
        await fs.writeFile(filePath, binaryData);

        // Set the response headers to indicate a downloadable file
        res.setHeader('Content-disposition', `attachment; filename=${fileName}`);
        res.setHeader('Content-type', 'application/pdf');

        // Send the binary data as the response
        res.status(200).end(binaryData);





    } catch (error) {
        next(error);
    }
};




module.exports = {
    placeOrder,
    loadOrderHistory,
    cancelOrder,
    generateRandomOrderId,
    loadOrderdetails,
    loadOrders,
    editStatus,
    adminOrderDetails,
    loadOrderSuccess,
    productReturn,
    loadInvoice,
    editProductReturn
}
