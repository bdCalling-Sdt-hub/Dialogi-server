const { default: mongoose } = require('mongoose');
const Friend = require('../models/Friend');

const addFriend = async (friendBody) => {
  try {
    const friend = new Friend(friendBody);
    await friend.save();
    return friend;
  } catch (error) {
    throw error;
  }
}

const getFriendByParticipants = async (participants) => {
  const ndata = await Friend.findOne({
    participants: {
      $all: participants
    }
  });
  return ndata;
}

const getFriendById = async (friendId) => {
  return await Friend.findById(friendId);
}

const getFriendByParticipantId = async (filters, options) => {
  const page = Number(options.page) || 1;
  const limit = Number(options.limit) || 10;
  const skip = (page - 1) * limit;
  console.log(filters);
  // Aggregation pipeline to get friends where the user is not req.body.userId
  const friendList = await Friend.find({
    participants: { $in: [filters.participantId] },
    status: filters.status
  }).select('participants status createdAt').populate({
    path: "participants",
    select: "fullName image",
    match: { _id: { $ne: filters.participantId } }, // Excluding the receiver from the populated field
  }).skip(skip).limit(limit).sort({ createdAt: -1 });

  // Count total results
  const totalResults = await Friend.countDocuments({
    participants: { $in: [filters.participantId] },
    status: filters.status
  });

  // Calculate total pages
  const totalPages = Math.ceil(totalResults / limit);

  const pagination = { totalResults, totalPages, currentPage: page, limit };
  return { friendList, pagination };
};

const deleteFriendByUserId = async (userId) => {
  return await Friend.deleteMany({ participants: { $in: [userId] } });
}

const updateFriend = async (friendId, friendBody) => {
  return await Friend.findByIdAndUpdate(friendId, friendBody, { new: true });
}

module.exports = {
  addFriend,
  getFriendByParticipants,
  getFriendByParticipantId,
  deleteFriendByUserId,
  updateFriend,
  getFriendById
}
