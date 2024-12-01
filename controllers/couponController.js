const Coupon = require("../models/couponModel")



const loadAddCoupon = async (req, res, next) => {
    try {
        
        res.render('addCoupon');
    } catch (error) {
        next(error);
    }
};
const addCoupon = async (req, res) => {
    try {
        // Create a new coupon instance
        const newCoupon = new Coupon({
            couponCode: req.body.couponCode,
            discountPercentage: req.body.discountAmount,
            startDate: req.body.startDate,
            endDate: req.body.endDate,
            maximumUses: req.body.maximumUses,
            minimumAmount: req.body.minimumCartAmount,
        });

        // Save the coupon to the database
        const savedCoupon = await newCoupon.save();

        if (savedCoupon) {
            res.redirect('/admin/view-coupon');
        }
    } catch (error) {
        
        if (error.name === 'MongoServerError' && error.code === 11000) {
            // Extract the duplicate key value from the error
            const duplicateValue = error.keyValue.couponCode;
            console.log(`Duplicate key error for coupon code: ${duplicateValue}`);

            res.redirect(`/admin/add-coupon?errorMessage=${encodeURIComponent(`Coupon code '${duplicateValue}' already exists`)}`);
        } else {
            // Handle other errors
            console.error(error);
            res.status(500).json({ success: false, message: 'Internal Server Error' });
        }
            
       
    }
};

const getValidCouponsForUser = async (userId, userCartTotal) => {
    try {
      // Fetch all coupons from the database
      const allCoupons = await Coupon.find({});
  
      // Validate each coupon for the user
      const validCoupons = [];
      for (const coupon of allCoupons) {
        const validationResult = await validateCoupon(coupon.couponCode, userCartTotal, userId);
        if (validationResult.isValid) {
          validCoupons.push(validationResult.coupon);
        }
      }
  
      return validCoupons;
    } catch (error) {
      console.error("Error fetching valid coupons:", error);
      return [];
    }
  };
  

const applyCoupon = async (req, res, next) => {
    try {
        const couponCode = req.body.coupon;
        const userCartTotal = req.body.userCartTotal;
        const userId = req.session.user_id;
        
        const validationResult = await validateCoupon(couponCode, userCartTotal, userId);

        if (validationResult.isValid) {
            // The coupon is valid, calculate and apply the discount
            const discountAmount = calculateDiscount(validationResult.coupon, userCartTotal);

            // Add the user's ID to the usersApplied array in the coupon
            await Coupon.findByIdAndUpdate(validationResult.coupon._id, {
                $inc: { usedCount: 1 },
                $addToSet: { usersApplied: userId }, // Add the user's ID to the array if not already present
            });

            res.redirect(`/cart?success=true&message=Coupon applied successfully&discountAmount=${discountAmount}`);
            

        } else {
            // The coupon is not valid, send an error response
            res.redirect(`/cart?success=false&message=Invalid coupon&errors=${encodeURIComponent(JSON.stringify(validationResult.errors))}`);
        }
    } catch (error) {
        console.error(error);
        next(error);
    }
};


const validateCoupon = async (couponCode, userCartTotal, userId) => {
    try {
        

        // Find the coupon in the database based on the provided coupon code
        const coupon = await Coupon.findOne({ couponCode: couponCode });
       
        if (!coupon) {
            
            return { isValid: false, errors: ['Invalid coupon code'] };
        }

        // Check if the coupon has expired
        const currentDate = new Date();
        if (coupon.endDate < currentDate) {
            
            return { isValid: false, errors: ['Coupon has expired'] };
        }

        // Check if the user has already applied the coupon
        const userAppliedIndex = coupon.usersApplied.findIndex((appliedUserId) => appliedUserId.equals(userId));
        if (userAppliedIndex !== -1) {
            
            return { isValid: false, errors: ['Coupon has already been applied by this user'] };
        }

        // Check if the coupon has reached its maximum usage limit
        if (coupon.maximumUses && coupon.usedCount >= coupon.maximumUses) {
            
            return { isValid: false, errors: ['Coupon has reached its maximum usage limit'] };
        }

        // Check if the user cart total meets the minimum amount required for the coupon
        if (userCartTotal < coupon.minimumAmount) {
            
            return { isValid: false, errors: ['Minimum cart amount not met'] };
        }

        // If all checks pass, the coupon is considered valid
        return { isValid: true, coupon: coupon, errors: [] };
    } catch (error) {
        console.error(error);
        return { isValid: false, errors: ['Error validating coupon'] };
    }
};



// Function to calculate the discount amount
const calculateDiscount = (coupon, userCartTotal) => {
    
    const discountAmount = (coupon.discountPercentage / 100) * userCartTotal;

    return discountAmount;
};

const viewCoupon = async (req, res, next) => {
    try {
        const Coupons = await Coupon.find({});
        res.render('viewCoupon',{Coupons});
    } catch (error) {
        next(error);
    }
};
const deleteCoupon = async (req, res, next) => {
    try {
        const couponId = req.query.id;
        await Coupon.findByIdAndDelete(couponId);
    
        res.redirect('/admin/view-coupon')
       
  } catch (error) {
    console.error('Error deleting coupon:', error);
    next(error)
  }

} 
const loadEditCoupon = async (req, res, next) => {
    try {
        const couponId = req.query.id;
       
        const coupon = await Coupon.findById(couponId);
        res.render('editCoupon',{coupon})
       
  } catch (error) {
    
    next(error)
  }

} 
const EditCoupon = async (req, res, next) => {
    try {
        const couponId = req.body.couponId
       
        // Assuming you have a Coupon model and are using Mongoose
        const coupon = await Coupon.findById(couponId);
    
        // Update the coupon with the form data
        coupon.couponCode = req.body.couponCode;
        coupon.startDate = req.body.startDate;
        coupon.endDate = req.body.endDate;
        coupon.discountPercentage = req.body.discountAmount;
        coupon.maximumUses = req.body.maximumUses;
        coupon.minimumAmount = req.body.minimumCartAmount;

        // Save the updated coupon to the database
        await coupon.save();

        // Redirect to the view-coupon page or another appropriate page
        res.redirect('/admin/view-coupon');
    } catch (error) {
        next(error);
    }
};

   




module.exports={loadAddCoupon,
    addCoupon,
    applyCoupon,
    viewCoupon,
    deleteCoupon,
    loadEditCoupon,
    EditCoupon ,
    getValidCouponsForUser

}