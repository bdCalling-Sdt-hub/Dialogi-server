const Category = require('../models/Category');

const addCategory = async (categoryBody) => {
  try {
    var category = await getCategoryByName(categoryBody.name);
    if(category){
      return null;
    }
    category = new Category(categoryBody);
    await category.save();
    return category;
  } catch (error) {
    throw error;
  }
}

const getCategoryById = async (id) => {
  return await Category.findById(id);
}

const getCategoryByName = async (name) => {
  return await Category.findOne({ name: name });
}

const getAllCategorys = async (filter, options) => {
  const page = Number(options.page) || 1;
  const limit = Number(options.limit) || 10;
  const skip = (page - 1) * limit;
  const categoryList = await Category.find({...filter}).skip(skip).limit(limit).sort({createdAt: -1});
  const totalResults = await Category.countDocuments({...filter});
  const totalPages = Math.ceil(totalResults / limit);
  const pagination = {totalResults, totalPages, currentPage: page, limit};
  return {categoryList, pagination};
}

const updateCategory = async (categoryId,categorybody) => {
  try{
    return await Category.findByIdAndUpdate(categoryId, categorybody, { new: true });
  }
  catch(error){
    throw error;
  }
}

const deleteCategory = async (categoryId) => {
  try{
    return await Category.findByIdAndDelete(categoryId);
  }
  catch(error){
    throw error;
  }
}

module.exports = {
  addCategory,
  getCategoryById,
  updateCategory,
  getCategoryByName,
  getAllCategorys,
  deleteCategory
}
