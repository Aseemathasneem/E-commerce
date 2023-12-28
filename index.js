require('dotenv').config();

const express = require("express");
const app = express();
const noCache = require('./middleware/noCache');

// Import the connectDB function
const connectDB = require('./config/db');

// Connect to the MongoDB database
connectDB();

// Import your routes
const user_routes = require("./routes/userRoutes");
const admin_routes = require("./routes/adminRoutes");

// Import the error handler middleware
const errorHandler = require('./middleware/errorHandler');

// Use your routes
app.use('/', user_routes);
app.use('/admin', admin_routes);

// Use the noCache middleware
app.use(noCache);

// Use the error handler middleware (ensure it's placed after route handling middleware)
app.use(errorHandler);

// Set up the server to listen on port 3000
const PORT = process.env.PORT || 3000; // Use the PORT from environment variables or default to 3000
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
