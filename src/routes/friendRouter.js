const express = require('express');
const { getAllFriends } = require('../controllers/friendController');
const router = express.Router();
const { isValidUser } = require('../middlewares/auth')

router.get('/', isValidUser, getAllFriends);

module.exports = router;