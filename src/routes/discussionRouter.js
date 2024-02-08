const express = require('express');
const { addNewDiscussion, allDiscussions, addNewReply, allReplies, getDiscussionDetails } = require('../controllers/discussionController');
const router = express.Router();
const { isValidUser } = require('../middlewares/auth')


router.post('/',  isValidUser, addNewDiscussion);
router.get('/', allDiscussions);
router.get('/:id', getDiscussionDetails);
router.post('/reply', isValidUser, addNewReply);
router.get('/reply', allReplies);


module.exports = router;