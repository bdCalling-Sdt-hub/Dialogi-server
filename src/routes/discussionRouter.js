const express = require('express');
const { addNewDiscussion, allDiscussions, addNewReply, allReplies } = require('../controllers/discussionController');
const router = express.Router();
const { isValidUser } = require('../middlewares/auth')


router.post('/',  isValidUser, addNewDiscussion);
router.get('/', allDiscussions);
router.post('/reply', isValidUser, addNewReply);
router.get('/reply', allReplies);


module.exports = router;