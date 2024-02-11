const express = require('express');
const { allSubscriptions } = require('../controllers/subscriptionController');
const router = express.Router();
const { isValidUser } = require('../middlewares/auth')

router.get('/', allSubscriptions);

module.exports = router;