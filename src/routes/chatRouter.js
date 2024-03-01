const express = require('express');
const { getAllChats, getChatMembers, getCommunities } = require('../controllers/chatController');
const { addCommunityRequest } = require('../controllers/communityController');
const router = express.Router();
const { isValidUser } = require('../middlewares/auth')

router.get('/by-category', isValidUser, getCommunities);
router.get('/:id', isValidUser, getChatMembers);
router.get('/', isValidUser, getAllChats);
router.post('/community-chat', isValidUser, addCommunityRequest);


module.exports = router;