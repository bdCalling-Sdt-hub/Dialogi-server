const express = require('express');
const { addNewQuestion, allQuestions } = require('../controllers/questionController');
const router = express.Router();
const { isValidUser } = require('../middlewares/auth')

router.post('/',  isValidUser, addNewQuestion);
router.get('/', allQuestions);

module.exports = router;