const Chat = require('../models/Chat');
const mongoose = require('mongoose');

const addChat = async (chatBody) => {
  try {
    const chat = new Chat(chatBody);
    await chat.save();
    return chat;
  } catch (error) {
    throw error;
  }
}

const getChatByParticipants = async (data) => {
  const ndata = await Chat.findOne({
    participants: {
      $all: data.participants
    },
    type: !data.type ? 'single' : data.type
  });
  console.log('data--->', ndata, data);
  return ndata;
}

const getChatByParticipantId = async (filters, options) => {
  const page = Number(options.page) || 1;
  const limit = Number(options.limit) || 10;
  const skip = (page - 1) * limit;

  const participantId = new mongoose.Types.ObjectId(filters.participantId);
  const chatList = await Chat.aggregate([
    {
      $match: {
        participants: {
          $in: [participantId]
        }
      }
    },
    {
      $skip: skip
    },
    {
      $limit: limit
    },
    {
      $project: {
        groupName: {
          $cond: {
            if: { $eq: ["$type", "single"] },
            then: "$groupName",
            else: null
          }
        },
        participant: {
          $cond: {
            if: { $eq: ["$type", "single"] },
            then: {
              _id: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: "$participants",
                      as: "participant",
                      cond: { $ne: ["$$participant", participantId] }
                    }
                  },
                  0
                ]
              },
              fullName: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: "$participants.fullName",
                      as: "participant",
                      cond: { $ne: ["$$participant._id", participantId] }
                    }
                  },
                  0
                ]
              },
              image: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: "$participants.image",
                      as: "participant",
                      cond: { $ne: ["$$participant._id", participantId] }
                    }
                  },
                  0
                ]
              }
            },
            else: null
          }
        },
        type: 1,
        groupAdmin: 1,
        image: 1,
        // createdAt: 1,
        // updatedAt: 1
      }
    },
    {
      $lookup: {
        from: "users", // Assuming your user collection name is "users"
        localField: "participant._id",
        foreignField: "_id",
        as: "participantDetails"
      }
    },
    {
      $addFields: {
        participant: {
          $mergeObjects: [
            "$participant",
            {
              $arrayElemAt: ["$participantDetails", 0]
            }
          ]
        }
      }
    },
    {
      $project: {
        groupName: 1,
        "participant.fullName": 1,
        "participant.image": 1,
        type: 1,
        groupAdmin: 1,
        image: 1,
        // createdAt: 1,
        // updatedAt: 1
      }
    },
    {
      $unset: "participantDetails"
    }
  ]);
  const totalResults = await Chat.countDocuments({ participants: { $in: [participantId] } });
  const totalPages = Math.ceil(totalResults / limit);
  const pagination = { totalResults, totalPages, currentPage: page, limit };

  return {chatList, pagination};
}


module.exports = {
  addChat,
  getChatByParticipants,
  getChatByParticipantId
}
