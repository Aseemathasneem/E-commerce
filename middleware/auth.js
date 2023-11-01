const User = require("../models/userModel");

const isLogin = async (req, res, next) => {
  try {
    if (req.session.user_id) {
      // Fetch user data from your database or session
      const user = await User.findById(req.session.user_id);

      if (user) {
        // Store user information in req.session or req.locals
        req.session.user_name = user.name;
        // You can also store other user information as needed

        // Call next to proceed to the next middleware/route handler
        next();
      } else {
        // If the user is not found, you can clear the session and handle it as needed
        req.session.destroy(); // Clear the session
        next();
      }
    } else {
      // If the user_id is not set in the session, proceed to the next middleware/route handler
      next();
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
};

const isLogout = async (req, res, next) => {
  try {
    if (req.session.user_id) {
      // If logged in, proceed to the next middleware/route handler
      next();
    } else {
      // If not logged in, proceed to the next middleware/route handler
      next();
    }
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
};

module.exports = {
  isLogin,
  isLogout
};
