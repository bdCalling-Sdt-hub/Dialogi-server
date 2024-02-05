const express = require('express');
const { addNewCategory, allCategories } = require('../controllers/categoryController');
const router = express.Router();
const { isValidUser } = require('../middlewares/auth')

router.post('/',  isValidUser, addNewCategory);
router.get('/', allCategories);

module.exports = router;