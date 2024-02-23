const express = require('express');
const { getAllFriends, makeFriend, updateFriendStatus, getAllFriendsForGroup } = require('../controllers/friendController');
const router = express.Router();
const { isValidUser } = require('../middlewares/auth')

router.post('/', isValidUser, makeFriend);
router.get('/', isValidUser, getAllFriends);
router.get('/group', isValidUser, getAllFriendsForGroup);
router.put('/:id', isValidUser, updateFriendStatus);

module.exports = router;