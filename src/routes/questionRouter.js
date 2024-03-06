const express = require('express');
const { addNewQuestion, allQuestions, getSubCategory, getSubCategoryByName, updateQuestionById, deleteQuestionById } = require('../controllers/questionController');
const router = express.Router();
const { isValidUser } = require('../middlewares/auth');

router.post('/',  isValidUser, addNewQuestion);
router.put('/:id', isValidUser, updateQuestionById);
router.delete('/:id', isValidUser, deleteQuestionById);
router.get('/sub-category-by-name', getSubCategoryByName);
router.get('/sub-category/:categoryID', getSubCategory);
router.get('/:subCategory/:category', isValidUser, allQuestions);

module.exports = router;