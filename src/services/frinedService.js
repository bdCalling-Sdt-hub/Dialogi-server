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

const getFriendByParticipantId = async (filters, options) => {
  const page = Number(options.page) || 1;
  const limit = Number(options.limit) || 10;
  const skip = (page - 1) * limit;
  console.log('filters.participantId--->', filters);
  const participantId = new mongoose.Types.ObjectId(filters.participantId);

  // Aggregation pipeline to get friends where the user is not req.body.userId
  const friendList = await Friend.aggregate([
    {
      $match: {
        participants: {
          $in: [participantId]
        },
        status: !filters.status ? 'accepted' : filters.status
      }
    },
    {
      $skip: skip
    },
    {
      $limit: limit
    },
    {
      $lookup: {
        from: "users", // Assuming your user collection name is "users"
        localField: "participants",
        foreignField: "_id",
        as: "participantDetails"
      }
    },
    {
      $unwind: "$participantDetails"
    },
    {
      $project: {
        _id: 1,
        status: 1,
        createdAt: 1,
        updatedAt: 1,
        participant: {
          _id: "$participantDetails._id",
          fullName: "$participantDetails.fullName",
          image: "$participantDetails.image"
        }
      }
    }
  ]);

  // Count total results
  const totalResults = await Friend.countDocuments({
    participants: { $in: [participantId] }
  });

  // Calculate total pages
  const totalPages = Math.ceil(totalResults / limit);

  const pagination = { totalResults, totalPages, currentPage: page, limit };
  return { friendList, pagination };
};



module.exports = {
  addFriend,
  getFriendByParticipants,
  getFriendByParticipantId
}
