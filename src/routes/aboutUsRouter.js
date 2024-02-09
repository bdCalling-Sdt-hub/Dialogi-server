const express = require('express');
const { upgradeAboutUs, getAllAboutUs } = require('../controllers/aboutUsController');
const router = express.Router();
const { isValidUser } = require('../middlewares/auth')
const validatePolicy = require('../middlewares/policies/policyValidation');

router.post('/',  isValidUser, validatePolicy, upgradeAboutUs);
router.get('/', getAllAboutUs);

module.exports = router;