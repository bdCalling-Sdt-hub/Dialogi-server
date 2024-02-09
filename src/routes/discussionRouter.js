const express = require('express');
const { addNewDiscussion, allDiscussions, addNewReply, allReplies, getDiscussionDetails } = require('../controllers/discussionController');
const router = express.Router();
const { isValidUser } = require('../middlewares/auth')


router.post('/',  isValidUser, addNewDiscussion);
router.post('/reply', isValidUser, addNewReply);
router.get('/reply', allReplies);
router.get('/specific/:question', allDiscussions);
router.get('/:id', getDiscussionDetails);


module.exports = router;