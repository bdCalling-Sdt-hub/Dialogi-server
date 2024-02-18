const express = require('express');
const { getAllFriends, makeFriend, updateFriendStatus } = require('../controllers/friendController');
const router = express.Router();
const { isValidUser } = require('../middlewares/auth')

router.post('/', isValidUser, makeFriend);
router.get('/', isValidUser, getAllFriends);
router.put('/:id', isValidUser, updateFriendStatus);

module.exports = router;