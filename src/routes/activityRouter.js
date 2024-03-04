const express = require('express');
const { allActivity, deleteActivity } = require('../controllers/activityController');
const { isValidUser } = require('../middlewares/auth');
const router = express.Router();


router.get('/', isValidUser, allActivity);
router.delete('/:id', isValidUser, deleteActivity);


module.exports = router;