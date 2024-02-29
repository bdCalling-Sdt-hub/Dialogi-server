const express = require('express');
const { addNewFavourite, allFavourites } = require('../controllers/favouriteController');
const router = express.Router();
const { isValidUser } = require('../middlewares/auth')

router.post('/',  isValidUser, addNewFavourite);
router.get('/', isValidUser, allFavourites);

module.exports = router;