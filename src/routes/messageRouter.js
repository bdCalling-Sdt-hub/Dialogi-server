const express = require('express');
const { getAllMessages } = require('../controllers/messageController');
const router = express.Router();
const { isValidUser } = require('../middlewares/auth')

router.get('/', isValidUser, getAllMessages);

module.exports = router;