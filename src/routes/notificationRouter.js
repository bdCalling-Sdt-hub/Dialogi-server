const express = require('express');
const { getAllNotifications } = require('../controllers/notificationController');
const router = express.Router();
const { isValidUser } = require('../middlewares/auth')

router.get('/', isValidUser, getAllNotifications);

module.exports = router;