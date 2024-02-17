const express = require('express');
const { upgradeFaq, getAllFaqs } = require('../controllers/faqController');
const router = express.Router();
const { isValidUser } = require('../middlewares/auth')

router.post('/',  isValidUser, upgradeFaq);
router.get('/', getAllFaqs);

module.exports = router;