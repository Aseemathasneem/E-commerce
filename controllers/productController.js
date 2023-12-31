const Product = require("../models/productModel")
const Category = require("../models/categoryModel")
const path = require('path'); 
const loadProducts = async (req, res) => {
    try {
      const allCategories = await Category.find({});
      res.render('products', { category: allCategories })
    } catch (error) {
        next(error)
    }
  }
  const submitProducts = async (req, res) => {

    try {
    const imagePaths = req.files.map(file => path.basename(file.path)); // Extracting only the filenames
     const price = parseFloat(req.body.price);
     const offerPrice = parseFloat(req.body.offerPrice);
     const stock = parseInt(req.body.stock);
     const allCategories = await Category.find({});

     if (isNaN(price) || price <= 0 || isNaN(offerPrice) || offerPrice <= 0 || isNaN(stock) || stock <= 0) {
      return res.render('products', { message: 'Invalid input values. Ensure price, offer price, and stock are greater than zero.', category: allCategories });
  }

      const product = new Product({
        name: req.body.name,
        category: req.body.category,
        price: req.body.price,
        offerPrice: req.body.offerPrice,
        stock: req.body.stock,
        description: req.body.description,
        images: imagePaths
  
      });
      
      const savedProduct = await product.save();
      if (savedProduct) {
        res.render('products', { message: 'Product added successfully!', category: allCategories });
      } else {
        res.render('products', { message: 'Something went wrong!', category: allCategories });
      }
    } catch (error) {
      console.log(error.message);
    }
  
  }
  const loadProductsList = async (req, res) => {
    try {
      const products = await Product.find({});
     

  
        res.render('productList', { products });
      
    } catch (error) {
      console.log(error.message);
    }
  };
  
  
  
  
const deleteProduct =async(req,res)=>{
  try {
     const productId=req.query.id;
     
     const deleteProduct= await Product.findByIdAndDelete(productId) 
     if(deleteProduct){
      res.redirect('/admin/product-list')
     }
  } catch (error) {
      console.log(error.message);
  }
}
const loadEditProduct = async(req,res)=>{
  try {
      const productId = req.query.id;
      const product = await Product.findById(productId);
      const allCategories = await Category.find({});

      if (!product) {
          return res.status(404).send('Product not found');
      }
      
      res.render('editProduct', {productId,product,category: allCategories});
      
  } catch (error) {
    console.log(error.message)
  }
}


const editProduct = async (req, res) => {
  try {
    const productId = req.body.id;

    // Fetch the product by ID
    const product = await Product.findById(productId);

    // Check if the product exists
    if (!product) {
      return res.status(404).send('Product not found');
    }

    // Check for invalid input values
    const price = parseFloat(req.body.price);
    const offerPrice = parseFloat(req.body.offerPrice);
    const stock = parseInt(req.body.stock);

    if (isNaN(price) || price <= 0 || isNaN(offerPrice) || offerPrice <= 0 || isNaN(stock) || stock <= 0) {
      return res.render('products', { message: 'Invalid input values. Ensure price, offer price, and stock are greater than zero.', category: allCategories });
    }

    // Update the product fields
    product.name = req.body.name;
    product.category = req.body.category;
    product.price = req.body.price;
    product.offerPrice = req.body.offerPrice;
    product.stock = req.body.stock;
    product.description = req.body.description;

    // Handle deleted images
    const deletedImages = req.body.deletedImages ? JSON.parse(req.body.deletedImages) : [];

    if (deletedImages.length > 0) {
      // Remove the deleted images from the product.images array
      product.images = product.images.filter(image => {
        const filename = path.basename(image); // Extracting only the filename
        return !deletedImages.includes(encodeURIComponent(filename));
      });
    }

    if (req.files && req.files.length > 0) {
      // Extract image paths from req.files and add them to the product.images field
      const newImages = req.files.map(file => path.basename(file.path)); // Extracting only the filenames
      product.images = [...product.images, ...newImages];
    }

    // Save the updated product
    const updatedProduct = await product.save();

    if (updatedProduct) {
      res.redirect('/admin/product-list');
    } else {
      res.send('Product not updated');
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Error editing product');
  }
};



  module.exports={
    loadProducts,
    submitProducts,
    loadProductsList,
    deleteProduct,
    loadEditProduct,
    editProduct
    
}  









