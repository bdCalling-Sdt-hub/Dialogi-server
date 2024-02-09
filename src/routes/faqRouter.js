const express = require('express');
const { upgradeFaq, getAllFaqs } = require('../controllers/faqController');
const router = express.Router();
const { isValidUser } = require('../middlewares/auth')
const validatePolicy = require('../middlewares/policies/policyValidation');

router.post('/',  isValidUser, validatePolicy, upgradeFaq);
router.get('/', getAllFaqs);

module.exports = router;