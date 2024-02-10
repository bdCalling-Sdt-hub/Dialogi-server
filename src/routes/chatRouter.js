const express = require('express');
const { getAllChats } = require('../controllers/chatController');
const router = express.Router();
const { isValidUser } = require('../middlewares/auth')

router.get('/', isValidUser, getAllChats);

module.exports = router;