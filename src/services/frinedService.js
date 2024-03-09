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
    },
    status: 'accepted'
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

const getGroupCreateFriendByParticipantId = async (filters, options) => {
  const page = Number(options.page) || 1;
  const limit = Number(options.limit) || 10;
  const skip = (page - 1) * limit;
  const participantId = new mongoose.Types.ObjectId(filters.participantId);
  try {
    const friendList = await Friend.aggregate([
      {
        $match: {
          participants: { $in: [participantId] },
          status: filters.status
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "participants",
          foreignField: "_id",
          as: "participants"
        }
      },
      {
        $unwind: "$participants"
      },
      {
        $match: {
          "participants._id": { $ne: participantId }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "participants._id",
          foreignField: "_id",
          as: "otherParticipant"
        }
      },
      {
        $unwind: "$otherParticipant"
      },
      {
        $match: {
          "otherParticipant.subscription": "premium-plus"
        }
      },
      {
        $project: {
          "otherParticipant.fullName": 1,
          "otherParticipant.image": 1,
          "otherParticipant._id": 1,
          status: 1,
          createdAt: 1
        }
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    ]);

    // Count total results
    const countPipeline = [
      {
        $match: {
          participants: { $in: [participantId] },
          status: filters.status
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "participants",
          foreignField: "_id",
          as: "participants"
        }
      },
      {
        $unwind: "$participants"
      },
      {
        $match: {
          "participants._id": { $ne: participantId }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "participants._id",
          foreignField: "_id",
          as: "otherParticipant"
        }
      },
      {
        $unwind: "$otherParticipant"
      },
      {
        $match: {
          "otherParticipant.subscription": "premium-plus"
        }
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 }
        }
      }
    ];
    
    const countResult = await Friend.aggregate(countPipeline);
    const count = countResult.length > 0 ? countResult[0].count : 0;

    const totalPages = Math.ceil(count / limit);

    const pagination = { totalResults: count, totalPages, currentPage: page, limit };

    return { friendList, pagination };
  } catch (error) {
    console.error("Error in aggregation:", error);
    throw error;
  }
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
  getGroupCreateFriendByParticipantId,
  deleteFriendByUserId,
  updateFriend,
  getFriendById
}
