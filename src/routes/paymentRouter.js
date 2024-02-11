const express = require('express');
const { makePayment } = require('../controllers/paymentController');
const router = express.Router();
const { isValidUser } = require('../middlewares/auth')

router.post('/', isValidUser, makePayment);

module.exports = router;