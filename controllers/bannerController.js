const Banner = require("../models/bannerModel")
const path = require('path');
const loadAddbanner = async (req, res, next) => {
    try {
        
        res.render('addBanner');
    } catch (error) {
        next(error);
    }
};
const addBanner = async (req, res, next) => {
    try {
        const { title, description, url,sequence  } = req.body;
        const imageFilename = req.file.filename; // Get the filename from req.file

        // Create a new instance of the Banner model
        const newBanner = new Banner({
            sequence,
            title,
            description,
            isListed: true, // You can set a default value or get it from the form
            image: imageFilename, // Store only the filename
            url,
        });

        // Save the new banner to the database
        const savedBanner = await newBanner.save();

        // Respond with the saved banner data
        res.redirect('/admin/view-banners');
        
    } catch (error) {
        next(error);
    }
};

const viewBanner = async (req, res, next) => {
    try {
        // Retrieve all banners from the database
        const allBanners = await Banner.find();

        // Render the view and pass the banners as a variable
        res.render('bannerView', {path, banners: allBanners });
    } catch (error) {
        next(error);
    }
};
const deleteBanner = async (req, res, next) => {
    try {
        const bannerId = req.query.id; // Retrieve the banner ID from query parameters

        // Use findByIdAndDelete to find and delete the banner by ID
        const deletedBanner = await Banner.findByIdAndDelete(bannerId);

        // Check if the banner was deleted
        if (!deletedBanner) {
            return res.status(404).json({ error: 'Banner not found' });
        }

        // Respond with a success message or any other relevant information
        res.redirect('/admin/view-banners')

    } catch (error) {
        next(error);
    }
};
const loadEditbanner = async (req, res, next) => {
    try {
        const bannerId = req.query.id;
       
        const banner = await Banner.findById(bannerId);
        res.render('editBanner',{banner})
       
  } catch (error) {
    
    next(error)
  }

} 
const editBanner = async (req, res, next) => {
    try {
        const bannerId = req.body.bannerId;
        const { sequence, title, description, url } = req.body;

        let updatedBanner;

        // Check if a new image file is provided
        if (req.file) {
            updatedBanner = await Banner.findByIdAndUpdate(
                bannerId,
                {
                    sequence,
                    title,
                    description,
                    image: req.file.filename, // Update image with the new file name
                    url,
                },
                { new: true } // Return the modified document rather than the original
            );
        } else {
            // If no new image is provided, update other fields without changing the image
            updatedBanner = await Banner.findByIdAndUpdate(
                bannerId,
                {
                    sequence,
                    title,
                    description,
                    url,
                },
                { new: true }
            );
        }

        // Check if the banner was found and updated
        if (!updatedBanner) {
            return res.status(404).json({ error: 'Banner not found' });
        }

        res.redirect('/admin/view-banners');
    } catch (error) {
        next(error);
    }
};



module.exports = { 
    loadAddbanner,
    addBanner,
    viewBanner,
    deleteBanner,
    loadEditbanner,
    editBanner
   }