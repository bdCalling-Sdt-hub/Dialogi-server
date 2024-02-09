const express = require('express');
const { upgradePrivacyPolicy, getAllPrivacyPolicys } = require('../controllers/privacyPolicyController');
const router = express.Router();
const { isValidUser } = require('../middlewares/auth')
const validatePolicy = require('../middlewares/policies/policyValidation');

router.post('/',  isValidUser, validatePolicy, upgradePrivacyPolicy);
router.get('/', getAllPrivacyPolicys);

module.exports = router;