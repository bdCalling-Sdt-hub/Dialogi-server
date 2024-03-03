const express = require('express');
const { addNewDiscussion, addNewReply, getDiscussionDetails } = require('../controllers/discussionController');
const router = express.Router();
const { isValidUser } = require('../middlewares/auth')


router.post('/',  isValidUser, addNewDiscussion);
router.post('/reply', isValidUser, addNewReply);
router.get('/:id', isValidUser, getDiscussionDetails);


module.exports = router;