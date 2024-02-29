const express = require('express');
const { successPayment, successPaymentByStripe, makePaymentWithPaypal } = require('../controllers/paymentController');
const router = express.Router();
const { isValidUser } = require('../middlewares/auth')

router.post('/', isValidUser, successPayment);
// router.post('/stripe', isValidUser, successPaymentByStripe);
// router.post('/makepayment', isValidUser, makePaymentWithPaypal);

module.exports = router;