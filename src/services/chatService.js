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
  const result = await Chat.aggregate([
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
            then: {
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
            else: "$groupName"
          }
        },
        // participants: {
        //   $filter: {
        //     input: "$participants",
        //     as: "participant",
        //     cond: { $ne: ["$$participant", participantId] }
        //   }
        // },
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
        localField: "participants",
        foreignField: "_id",
        as: "participantDetails"
      }
    },
    {
      $addFields: {
        "participants": "$participantDetails",
      }
    },
    {
      $project: {
        participantDetails: 0
      }
    }
  ]);

  return result;
}


module.exports = {
  addChat,
  getChatByParticipants,
  getChatByParticipantId
}
