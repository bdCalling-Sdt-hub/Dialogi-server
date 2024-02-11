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

const getFriendByParticipants = async (data) => {
  const ndata = await Friend.findOne({
    participants: {
      $all: data.participants
    },
    type: !data.type ? 'pending' : data.type
  });
  return ndata;
}

const getFriendByParticipantId = async (filters, options) => {
  const page = Number(options.page) || 1;
  const limit = Number(options.limit) || 10;
  const skip = (page - 1) * limit;

  const friendList = await Friend.find({participants:{ $in: [filters.participantId] }}).skip(skip).limit(limit);
  const totalResults = await Friend.countDocuments({participants:{ $in: [filters.participantId] }});
  const totalPages = Math.ceil(totalResults / limit);
  const pagination = { totalResults, totalPages, currentPage: page, limit };
  return { friendList, pagination };
}


module.exports = {
  addFriend,
  getFriendByParticipants,
  getFriendByParticipantId
}
