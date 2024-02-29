const express = require('express');
const { getAllChats, getChatMembers } = require('../controllers/chatController');
const router = express.Router();
const { isValidUser } = require('../middlewares/auth')

router.get('/:id', isValidUser, getChatMembers);
router.get('/', isValidUser, getAllChats);

module.exports = router;