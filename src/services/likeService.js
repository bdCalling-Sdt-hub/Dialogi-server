const Like = require('../models/Like');

const upgradeLike = async (likeBody) => {
  try {
    var like = await getLikeByUserAndType(likeBody);
    if (like) {
      await deleteLike(like._id);
      return { message: 'Like removed', data: like };
    }
    like = new Like(likeBody);
    await like.save();
    return { message: 'Liked successfully', data: like };
  } catch (error) {
    throw error;
  }
}

const getLikeByUserAndType = async (likeBody) => {
  return await Like.findOne({ user: likeBody.user, type: likeBody.type });
}

const getLikeCountByDiscussion = async (discussionId) => {
  return await Like.countDocuments({ discussion: discussionId, type: 'discussion' });
}

const getLikeCountByReply = async (replyId) => {
  return await Like.countDocuments({ reply: replyId, type: 'reply' });
}

const deleteLike = async (likeId) => {
  try {
    return Like.findAndDeleteLike(likeId);
  }
  catch (error) {
    throw error;
  }
}

const deleteLikeByUserId = async (userId) => {
  try {
    return await Like.deleteMany({ user: userId });
  }
  catch (error) {
    throw error;
  }
}



module.exports = {
  upgradeLike,
  getLikeCountByDiscussion,
  getLikeCountByReply,
  deleteLike,
  deleteLikeByUserId
}
