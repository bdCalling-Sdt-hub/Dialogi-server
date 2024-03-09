const express = require('express');
const { getAllChats, getChatMembers, getCommunities, leaveFromGroup, kickMember, updateGroupName, deleteDeleteConversation } = require('../controllers/chatController');
const { addCommunityRequest, getCommunityRequestForUser, CommunityRequestDecision, joinCommunity } = require('../controllers/communityController');
const router = express.Router();
const { isValidUser } = require('../middlewares/auth')

router.get('/by-category', isValidUser, getCommunities);
router.get('/community-chat', isValidUser, getCommunityRequestForUser);
router.get('/:id', isValidUser, getChatMembers);
router.get('/', isValidUser, getAllChats);
router.post('/community-chat', isValidUser, addCommunityRequest);
router.post('/join-community', isValidUser, joinCommunity);
router.patch('/community-chat/:id', isValidUser, CommunityRequestDecision)
router.patch('/group-name/:id', isValidUser, updateGroupName)
router.patch('/leave-group/:id', isValidUser, leaveFromGroup)
router.patch('/kick-member/:id', isValidUser, kickMember)
router.delete('/:id', isValidUser, deleteDeleteConversation)

module.exports = router;