const express = require('express');
const { getAllFriends, makeFriend } = require('../controllers/friendController');
const router = express.Router();
const { isValidUser } = require('../middlewares/auth')

router.post('/', isValidUser, makeFriend);
router.get('/', isValidUser, getAllFriends);

module.exports = router;