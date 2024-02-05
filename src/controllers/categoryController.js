require('dotenv').config();
const response = require("../helpers/response");
const logger = require("../helpers/logger");
const { addCategory, getAllCategorys, updateCategory, getCategoryByName, getCategoryById, deleteCategory } = require('../services/categoryService');

const addNewCategory = async (req, res) => {
  try{
    if(req.body.userRole!=='admin'){
      res.status(400).json(response({ status: 'Error', statusCode: '400', type: 'category', message: req.t('unauthorised') }));
    }
    const existingCategory = await getCategoryByName(req.body.name);
    if(existingCategory){
      return res.status(400).json(response({ status: 'Error', statusCode: '400', type: 'category', message: req.t('category-exists') }));
    }
    const category = await addCategory(req.body);
    return res.status(201).json(response({ status: 'Success', statusCode: '201', type: 'category', message: req.t('category-added'), data: category }));
  }
  catch(error){
    console.error(error);
    logger.error(error.message, req.originalUrl);
    return res.status(500).json(response({ status: 'Error', statusCode: '500', type: 'category', message: req.t('server-error') }));
  }
}

const allCategories = async (req, res) => {
  try{
    const { page, limit } = req.query;
    const options = { page, limit };
    const filter = {};
    const categorys = await getAllCategorys(filter, options);
    return res.status(200).json(response({ status: 'Success', statusCode: '200', message: req.t('categorys'), data: categorys }));
  }
  catch(error){
    console.error(error);
    logger.error(error.message, req.originalUrl);
    return res.status(500).json(response({ status: 'Error', statusCode: '500', type: 'category', message: req.t('server-error') }));
  }
}

const updateCategoryById = async (req, res) => {
  try{
    const category = await getCategoryById(req.params.id);
    if(!category){
      return res.status(404).json(response({ status: 'Error', statusCode: '404', type: 'category', message: req.t('category-not-found') }));
    }
    const updatedCategory = await updateCategory(req.params.id, req.body);
    return res.status(200).json(response({ status: 'Success', statusCode: '200', type: 'category', message: req.t('category-updated'), data: updatedCategory }));
  }
  catch(error){
    console.error(error);
    logger.error(error.message, req.originalUrl);
    return res.status(500).json(response({ status: 'Error', statusCode: '500', type: 'category', message: req.t('server-error') }));
  }
}

const deleteCategoryById = async (req, res) => {
  try{
    const category = await getCategoryById(req.params.id);
    if(!category){
      return res.status(404).json(response({ status: 'Error', statusCode: '404', type: 'category', message: req.t('category-not-found') }));
    }
    await deleteCategory(req.params.id);
    return res.status(200).json(response({ status: 'Success', statusCode: '200', type: 'category', message: req.t('category-deleted') }));
  }
  catch(error){
    console.error(error);
    logger.error(error.message, req.originalUrl);
    return res.status(500).json(response({ status: 'Error', statusCode: '500', type: 'category', message: req.t('server-error') }));
  }
}

const getCategoryDetails = async (req, res) => {
  try{
    const category = await getCategoryById(req.params.id);
    if(!category){
      return res.status(404).json(response({ status: 'Error', statusCode: '404', type: 'category', message: req.t('category-not-found') }));
    }
    return res.status(200).json(response({ status: 'Success', statusCode: '200', type: 'category', message: req.t('category-details'), data: category }));
  }
  catch(error){
    console.error(error);
    logger.error(error.message, req.originalUrl);
    return res.status(500).json(response({ status: 'Error', statusCode: '500', type: 'category', message: req.t('server-error') }));
  }
}

module.exports = { addNewCategory, allCategories, updateCategoryById, deleteCategoryById, getCategoryDetails }