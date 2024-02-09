const express = require('express');
const { upgradePersonalDataPolicy, getAllPersonalDataPolicys } = require('../controllers/personalDataPolicyController');
const router = express.Router();
const { isValidUser } = require('../middlewares/auth')
const validatePolicy = require('../middlewares/policies/policyValidation');

router.post('/',  isValidUser, validatePolicy, upgradePersonalDataPolicy);
router.get('/', getAllPersonalDataPolicys);

module.exports = router;