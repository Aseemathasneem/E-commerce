const User = require('../models/userModel');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');

const bcryptjs = require('bcryptjs');
const randomstring = require('randomstring')
const config = require('../config/config')
const nodemailer = require('nodemailer')

const excel = require('exceljs');
const ejs = require('ejs')
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
// const { default: orders } = require('razorpay/dist/types/orders');


const securePassword = async (password) => {
  try {
    const passwordHash = await bcryptjs.hash(password, 10)
    return passwordHash

  } catch (error) {
    res.status(400).send(error.message)
  }

}


const sendResetPasswordMai = async (name, email, token) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: config.emailUser,
        pass: config.emailPassword,
      },
    });
    const mailOptions = {
      from: config.emailUser,
      to: email,
      subject: 'for reset password',
      html: '<p>Hii  ' + name + ', Please click here to <a href="http://127.0.0.1:3000/admin/forget-password?token=' + token + '">Reset </a> your password.</p>'

    }
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log('Email has been sent:', info.response);
      }
    });
  } catch (error) {
    console.log(error.message)
  }
}


const loadLogin = async (req, res) => {
  try {
    res.render('login');
  } catch (error) {
    console.log(error.message);
  }
};

const verifyLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const userData = await User.findOne({ email: email });

    if (userData) {
      const passwordMatch = await bcryptjs.compare(password, userData.password);

      if (passwordMatch) {
        if (userData.is_admin === 0) {
          res.render('login', { message: 'Email and password are incorrect' });
        } else {
          req.session.admin_id = userData._id;
          res.redirect('/admin/home');
        }
      } else {
        res.render('login', { message: 'Email and password are incorrect' });
      }
    } else {
      res.render('login', { message: 'Email and password are incorrect' });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Server Error');
  }
};


const loadDashboard = async (req, res,next) => {
  try {
    const paymentMethodData = await fetchPaymentMethodData();
    const monthlySalesData = await fetchMonthlySalesData();
    const totalOrders = await countTotalOrders()
    const totalEarnings = await calculateTotalEarnings();
    const totalProducts = await calculateTotalProducts();
   
    res.render('home', { paymentMethodData,monthlySalesData,totalOrders,totalEarnings,totalProducts });
  } catch (error) {
   next(error)
  }
};
const calculateTotalProducts = async () => {
  try {
    const totalProducts = await Product.countDocuments();
    return totalProducts;
  } catch (error) {
    throw error;
  }
};

const calculateTotalEarnings = async () => {
  try {
    const totalEarningsData = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$totalAmount' },
        },
      },
    ]);

    // Extract totalEarnings from the result
    const totalEarnings = totalEarningsData.length > 0 ? totalEarningsData[0].totalEarnings : 0;

    return totalEarnings;
  } catch (error) {
    throw error;
  }
};
const countTotalOrders = async () => {
  try {
    const totalOrders = await Order.countDocuments();
    return totalOrders;
  } catch (error) {
    throw error;
  }
};
const fetchMonthlySalesData = async () => {
  try {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Aggregate to get monthly sales data
    const monthlySalesData = await Order.aggregate([
      {
        $group: {
          _id: { $month: '$orderDate' },
          totalAmount: { $sum: '$totalAmount' },
        },
      },
      { $sort: { '_id': 1 } }, // Sort by month
    ]);
    // Process the data to create labels and values for the chart
    const labels = monthlySalesData.map((item) => monthNames[item._id - 1]); // Adjust for zero-based index
    const values = monthlySalesData.map((item) => item.totalAmount);

    return { labels, values };
  } catch (error) {
    throw error;
  }
};
const fetchPaymentMethodData = async () => {
  try {
    // Aggregate to get payment method distribution
    const paymentMethodData = await Order.aggregate([
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
        },
      },
    ]);

    // Process the data to create labels and values for the chart
    const labels = paymentMethodData.map((item) => item._id);
    const values = paymentMethodData.map((item) => item.count);

    return { labels, values };
  } catch (error) {
    throw error;
  }
};
const logout = async (req, res) => {
  try {
    req.session.destroy();
    res.redirect('/admin');
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Server Error');
  }
};

const forgetLoad = async (req, res) => {
  try {
    res.render('forget')
  } catch (error) {
    console.log(error.message)
  }
}
const forgetVerify = async (req, res) => {
  try {
    const email = req.body.email

    const userData = await User.findOne({ email: email })
    if (userData) {
      if (userData.is_admin === 0) {
        res.render('forget', { message: 'Email is incorrect' })
      } else {
        const randomString = randomstring.generate()

        const updatedData = await User.updateOne({ email: email }, { $set: { token: randomString } })
        sendResetPasswordMai(userData.name, userData.email, randomString)
        res.render('forget', { message: 'Please check your mail to reset your password' })
      }
    } else {
      res.render('forget', { message: 'Email is incorrect' })
    }


  } catch (error) {
    console.log(error.message)

  }
}
const forgetPasswordLoad = async (req, res) => {
  try {
    const token = req.query.token


    const tokenData = await User.findOne({ token: token })

    if (tokenData) {
      res.render('forget-password', { admin_id: tokenData._id })
    } else {
      res.render('404', { message: 'Invalid link' })
    }
  } catch (error) {
    console.log(error.message)
  }
}
const resetPassword = async (req, res) => {
  try {
    const password = req.body.password

    const admin_id = req.body.admin_id


    const securePass = await securePassword(password)

    const updatedData = await User.findByIdAndUpdate({ _id: admin_id }, { $set: { password: securePass, token: '' } })
    res.redirect('/admin')
  } catch (error) {
    console.log(error.message)
  }
}

const loadUsers = async (req, res) => {
  try {
    const userData = await User.findById(req.session.user_id);

    const usersData = await User.find({ is_admin: 0 });
    res.render('users', { admin: userData, users: usersData });
  } catch (error) {
    console.log(error.message);
  }
};
const userOrders = async (req, res, next) => {
  try {
    const userId = req.query.id;

    // Use await with the asynchronous operation
    const orders = await Order.find({ user_id: userId }).populate('orderItems.product');

    // Render the 'userOrders' view and pass the orders as data
    res.render('userOrders', { orders });
  } catch (error) {
    // Pass the error to the next middleware
    next(error);
  }
};



// In your adminController
const blockUser = async (req, res) => {
  try {
    const userId = req.query.id; // Extract the user ID from the query parameter
     
    // Find the user by ID
    const user = await User.findById(userId);
   
    if (user) {
     
      user.is_blocked = !user.is_blocked;
      
      
        await user.save(); // Save the updated user
      

      // Redirect to the user listing page or any appropriate page
      res.redirect('/admin/users'); 
    } else {
      res.status(404).send('User not found');
    }
  } catch (error) {
    res.status(500).send('Error toggling user status');
  }
};
const loadReportForm = async (req, res, next) => {
  try {
      
      res.render('sales-reportForm');
  } catch (error) {
      next(error);
  }
};
const generateReport = async (req, res, next) => {
  try {
      const startingDate = req.body.startingDate;
      const endingDate = req.body.endingDate;
     
      // Construct the query to find delivered orders within the specified date range
      const query = {
          status: 'Delivered',
          orderDate: {
              $gte: new Date(startingDate),
              $lte: new Date(endingDate),
          },
      };

      // Fetch orders based on the query and sort by date in descending order
      const orders = await Order.find(query).sort({orderDate : -1 });
       // Calculate total sales amount and total number of orders
       let totalSalesAmount = 0;
       let totalOrders = orders.length;

       // Iterate through the orders to sum up the total sales amount
       for (const order of orders) {
           totalSalesAmount += order.totalAmount;
       }
      
      // Pass the fetched orders to the view
      res.render('sales-report',{orders,
        totalSalesAmount,
        totalOrders,
        startingDate,
        endingDate}  );
  } catch (error) {
      next(error);
  }
};
const salesReportPdf = async (req, res, next) => {
  try {
    let startingDate = req.query.startingDate;
    let endingDate = req.query.endingDate;

    const query = {
      status: 'Delivered',
      orderDate: {
        $gte: new Date(startingDate),
        $lte: new Date(endingDate),
      },
    };

    const orders = await Order.find(query).sort({ orderDate: -1 });
    let totalSalesAmount = 0;
    let totalOrders = orders.length;

    for (const order of orders) {
      totalSalesAmount += order.totalAmount;
    }

    const data = {
      orders,
      totalSalesAmount,
      totalOrders,
      startingDate,
      endingDate,
    };

    const filePathName = path.join(__dirname, '..', 'views', 'admin', 'reportPdf.ejs');
    const htmlString = fs.readFileSync(filePathName).toString();
    const ejsData = ejs.render(htmlString, data);

    const browser = await puppeteer.launch({
      
      args: ['--no-sandbox', '--disable-setuid-sandbox'], 
  });
    const page = await browser.newPage();
    await page.setContent(ejsData);
    const pdfBuffer = await page.pdf({ format: 'Letter' });
    await browser.close();

    res.setHeader('Content-Disposition', 'attachment; filename=sales-report.pdf');
    res.setHeader('Content-Type', 'application/pdf');
    res.status(200).end(pdfBuffer, 'binary');
  } catch (error) {
    next(error);
  }
};


const salesReportExcel = async (req, res, next) => {
  try {
    let startingDate = req.query.startingDate;
    let endingDate = req.query.endingDate;

    // Fetch orders based on the query and sort by date in descending order
    const query = {
      status: 'Delivered',
      orderDate: {
        $gte: new Date(startingDate),
        $lte: new Date(endingDate),
      },
    };

    const orders = await Order.find(query).sort({ orderDate: -1 });
    let totalOrders = 0;
    let totalSalesAmount = 0;

    // Create a new workbook and add a worksheet
    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');

    // Define columns in the worksheet based on the order model
    worksheet.columns = [
      { header: 'Order ID', key: 'orderID', width: 15 },
      { header: 'Order Date', key: 'orderDate', width: 20 },
      { header: 'Total Amount', key: 'totalAmount', width: 20 },
      { header: 'Total Orders', key: 'totalOrders', width: 15 },
      { header: 'Total Sales Amount', key: 'totalSalesAmount', width: 15 },
    ];

    // Add data rows
    orders.forEach((order) => {
      // Increment totalOrders and totalSalesAmount for each order
      totalOrders++;
      totalSalesAmount += order.totalAmount;

      // Add a row for each order
      worksheet.addRow({
        orderID: order.orderID,
        orderDate: order.orderDate.toISOString().slice(0, 10),
        totalAmount: order.totalAmount,
        totalOrders: '', // Add a placeholder for totalOrders
        totalSalesAmount: '', // Add a placeholder for totalSalesAmount
      });
    });
    const totalRow = worksheet.addRow({
      orderID: '', // Add a placeholder for orderID
      orderDate: '', // Add a placeholder for orderDate
      totalAmount: '', // Add a placeholder for quantity
      totalOrders: totalOrders, // Set the value for totalOrders
      totalSalesAmount: totalSalesAmount.toFixed(2), // Set the value for totalSalesAmount
    });

    // Create a buffer containing the Excel file
    const buffer = await workbook.xlsx.writeBuffer();

    // Set the appropriate headers for Excel download
    res.setHeader('Content-Disposition', 'attachment; filename=sales-report.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.status(200).end(buffer, 'binary');
  } catch (error) {
    next(error);
  }
};













module.exports = {
  loadLogin,
  verifyLogin,
  loadDashboard,
  logout,
  forgetLoad,
  forgetVerify,
  forgetPasswordLoad,
  resetPassword,
  loadUsers,
  userOrders,
  blockUser,
  loadReportForm,
  generateReport ,
  salesReportPdf,
  salesReportExcel
  

  
}