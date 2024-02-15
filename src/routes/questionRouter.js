const express = require('express');
const { addNewQuestion, allQuestions, getSubCategory } = require('../controllers/questionController');
const router = express.Router();
const { isValidUser } = require('../middlewares/auth');

router.post('/',  isValidUser, addNewQuestion);
router.get('/sub-category/:categoryID', getSubCategory);
router.get('/:subCategory', allQuestions);

module.exports = router;