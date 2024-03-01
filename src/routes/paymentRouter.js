const express = require('express');
const { successPayment, paymentList } = require('../controllers/paymentController');
const router = express.Router();
const { isValidUser } = require('../middlewares/auth')

router.post('/', isValidUser, successPayment);
router.get('/', isValidUser, paymentList);
// router.post('/stripe', isValidUser, successPaymentByStripe);
// router.post('/makepayment', isValidUser, makePaymentWithPaypal);

module.exports = router;