const express = require('express');
const { addNewQuestion, allQuestions, getSubCategory, getSubCategoryByName } = require('../controllers/questionController');
const router = express.Router();
const { isValidUser } = require('../middlewares/auth');

router.post('/',  isValidUser, addNewQuestion);
router.get('/sub-category-by-name', getSubCategoryByName);
router.get('/sub-category/:categoryID', getSubCategory);
router.get('/:subCategory/:category', isValidUser, allQuestions);

module.exports = router;