const Dislike = require('../models/Dislike');

const upgradeDislike = async (dislikeBody) => {
  try {
    var dislike = await getDislikeByUserAndType(dislikeBody);
    if (dislike) {
      await deleteDislike(dislike._id);
      return { message: 'Dislike removed', data: dislike};
    }
    dislike = new Dislike(dislikeBody);
    const dislikeData = await dislike.save();
    return { message: 'Disliked successfully', data: dislikeData };
  } catch (error) {
    throw error;
  }
}

const getDislikeByUserAndType = async (dislikeBody) => {
  if(dislikeBody.type === 'discussion'){
    return await Dislike.findOne({ user: dislikeBody.user, discussion: dislikeBody.discussion,type: dislikeBody.type });
  }
  else{
    return await Dislike.findOne({ user: dislikeBody.user, reply: dislikeBody.reply,type: dislikeBody.type });
  }
}

const getDislikeCountByDiscussion = async (discussionId) => {
  return await Dislike.countDocuments({ discussion: discussionId, type: 'discussion' });
}

const getDislikeCountByReply = async (replyId) => {
  return await Dislike.countDocuments({ reply: replyId, type: 'reply' });
}

const deleteDislike = async (dislikeId) => {
  try {
    return Dislike.findByIdAndDelete(dislikeId);
  }
  catch (error) {
    throw error;
  }
}

const deleteDislikeByUserId = async (userId) => {
  try {
    return await Dislike.deleteMany({ user: userId });
  }
  catch (error) {
    throw error;
  }
}


module.exports = {
  upgradeDislike,
  getDislikeCountByDiscussion,
  getDislikeCountByReply,
  deleteDislike,
  deleteDislikeByUserId
}
