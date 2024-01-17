const express = require('express');
const { upgradePaymentInfo, getAllPaymentInfo } = require('../controllers/paymentInfoController');
const router = express.Router();
const { isValidUser } = require('../middlewares/auth')
const validatePaymentInfo = require('../middlewares/paymentInfo/paymentInfoValidation');

router.post('/', isValidUser, validatePaymentInfo, upgradePaymentInfo);
router.get('/', getAllPaymentInfo);

module.exports = router;