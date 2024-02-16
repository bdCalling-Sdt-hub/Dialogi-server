const Dislike = require('../models/Dislike');

const upgradeDislike = async (dislikeBody) => {
  try {
    var dislike = await getDislikeByUserAndType(dislikeBody);
    if (dislike) {
      await deleteDislike(dislike._id);
      return { message: 'Dislike removed' };
    }
    dislike = new Dislike(dislikeBody);
    await dislike.save();
    return { message: 'Disliked successfully' };
  } catch (error) {
    throw error;
  }
}

const getDislikeByUserAndType = async (dislikeBody) => {
  return await Dislike.findOne({ user: dislikeBody.user, type: dislikeBody.type });
}

const getDislikeCountByDiscussion = async (discussionId) => {
  return await Dislike.countDocuments({ discussion: discussionId, type: 'discussion' });
}

const getDislikeCountByReply = async (replyId) => {
  return await Dislike.countDocuments({ reply: replyId, type: 'reply' });
}

const deleteDislike = async (dislikeId) => {
  try {
    return findAndDeleteDislike(dislikeId);
  }
  catch (error) {
    throw error;
  }
}



module.exports = {
  upgradeDislike,
  getDislikeCountByDiscussion,
  getDislikeCountByReply,
  deleteDislike
}
