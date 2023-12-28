const User = require("../models/userModel")
const isLogin = async (req, res, next) => {
    try {
      if (req.session.user) {
        // Include the isBlocked middleware here
        const userId = req.session.user_id;
  
        if (userId) {
          // Retrieve the user from the database using the user ID
          const user = await User.findById(userId);
  
          // Check if the user is blocked
          if (user && user.is_blocked) {
            // Log out the user if needed
            delete req.session.user;
  
            // Redirect the blocked user to the home page
            return res.redirect('/home');
          }
        }
  
        // If the user is not blocked or there is no user ID, proceed to the next middleware
        next();
      } else {
        res.redirect('/home');
      }
    } catch (error) {
      console.log('Error in isLogin middleware:', error.message);
      res.redirect('/home'); // Redirect on error
    }
  };
  

const isLogout = async(req,res,next)=>{
  try {
      if (req.session.user) {
          res.redirect('/home')
      }
      next();
  } catch (error) {
      console.log(error.message);
  }
}

  
module.exports = {
  isLogin,
  isLogout,
  
}