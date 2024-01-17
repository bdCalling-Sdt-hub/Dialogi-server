const express = require('express');
const { upgradeSupport, getAllSupports } = require('../controllers/supportController');
const router = express.Router();
const { isValidUser } = require('../middlewares/auth')
const validatePolicy = require('../middlewares/policies/policyValidation');

router.post('/',  isValidUser, validatePolicy, upgradeSupport);
router.get('/', getAllSupports);

module.exports = router;