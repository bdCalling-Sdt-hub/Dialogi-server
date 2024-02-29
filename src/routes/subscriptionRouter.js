const express = require('express');
const { allSubscriptions, updateSubscription } = require('../controllers/subscriptionController');
const router = express.Router();
const { isValidUser } = require('../middlewares/auth')

router.get('/', allSubscriptions);
router.put('/:id', isValidUser, updateSubscription);

module.exports = router;