const Category = require("../models/categoryModel")
const loadCategory = async (req, res) => {
    try {
        const allCategories = await Category.find({});
        res.render('category1', { category: allCategories })
    } catch (error) {
        next(error);
    }
}
const loadAddCategory =  async (req, res) => {
    try {
        
        res.render('category2')
    } catch (error) {
        next(error);
    }
}

const submitCategory = async (req, res, next) => {
    try {
        const categoryName = req.body.category;

        // Check if the category already exists (case-sensitive)
        const existingCategory = await Category.findOne({ categoryName: { $regex: new RegExp('^' + categoryName + '$', 'i') } });

        if (existingCategory) {
            // If category exists, render the page with an error message
            const allCategories = await Category.find({});
            return res.render('category2', { category: allCategories, message: 'This category already exists' });
        }

        // If the category doesn't exist, save the new category
        const newCategory = new Category({
            categoryName: categoryName
        });
        await newCategory.save();

        res.redirect('/admin/category-list');

    } catch (error) {
        next(error);
    }
};


const deleteCategory=async(req,res)=>{
    try {
       const categoryId=req.query.id;
       const deleteCategory= await Category.findByIdAndDelete(categoryId) 
       if(deleteCategory){
        res.redirect('/admin/category-list')
       }
    } catch (error) {
        console.log(error.message);
    }
}
const loadEditCategory = async(req,res)=>{
    try {
        const categoryId = req.query.id;
        const category = await Category.findById(categoryId);

        if (!category) {
            return res.status(404).send('Category not found');
        }
        
        res.render('editCategory', { categoryId, categoryName: category.categoryName });
        
    } catch (error) {
      console.log(error.message)
    }
}

const editCategory = async (req, res,next) => {
    try {
        const categoryId = req.body.id;
        const newCategoryName = req.body.category;

        // Check if the new category name already exists
        const existingCategory = await Category.findOne({ categoryName: { $regex: new RegExp('^' + newCategoryName + '$', 'i') } });

        if (existingCategory) {
            const allCategories = await Category.find({});
            return res.render('category2', { category: allCategories, message: 'This category already exists' });
        }

        // If the category name doesn't exist, update the category
        const updatedCategory = await Category.findByIdAndUpdate(categoryId, { categoryName: newCategoryName });

        if (updatedCategory) {
            res.redirect('/admin/category-list');
        } else {
            res.send('Category not found');
        }
    } catch (error) {
       next(error)
    }
};


module.exports = {
  loadCategory,
  loadAddCategory,
  submitCategory,
  deleteCategory,
  loadEditCategory,
  editCategory

  
  
}    