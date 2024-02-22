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

// const getChatByParticipantId = async (filters, options) => {
//   const page = Number(options.page) || 1;
//   const limit = Number(options.limit) || 10;
//   const skip = (page - 1) * limit;

//   const participantId = new mongoose.Types.ObjectId(filters.participantId);
//   const chatList = await Chat.find({ participants: { $in: [participantId] } }).populate({
//     path: "participants",
//     select: "fullName image",
//     match: { _id: { $ne: participantId } }, // Excluding the receiver from the populated field
//   }).skip(skip).limit(limit).sort({ createdAt: -1 });
//   const totalResults = await Chat.countDocuments({ participants: { $in: [participantId] } });
//   const totalPages = Math.ceil(totalResults / limit);
//   const pagination = { totalResults, totalPages, currentPage: page, limit };

//   return {chatList, pagination};
// }

const getChatByParticipantId = async (filters, options) => {
  try {
    const page = Number(options.page) || 1;
    const limit = Number(options.limit) || 10;
    const skip = (page - 1) * limit;

    const participantId = new mongoose.Types.ObjectId(filters.participantId);

    const chatList = await Chat.aggregate([
      { $match: { participants: participantId } },
      {
        $lookup: {
          from: "messages",
          let: { chatId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$chat", "$$chatId"] } } },
            { $sort: { createdAt: -1 } }, // Sort messages in descending order by createdAt
            { $limit: 1 },
            { $project: { message: 1, createdAt: 1 } } // Project only the content and createdAt of the latest message
          ],
          as: "latestMessage"
        }
      },
      { $unwind: { path: "$latestMessage", preserveNullAndEmptyArrays: true } },
      { $sort: { "latestMessage.createdAt": -1 } }, // Sort chat list based on the createdAt of the latest message
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: "users",
          localField: "participants",
          foreignField: "_id",
          as: "participants"
        }
      },
      {
        $addFields: {
          participants: {
            $map: {
              input: {
                $filter: {
                  input: "$participants",
                  as: "participant",
                  cond: { $ne: ["$$participant._id", participantId] }
                }
              },
              as: "participant",
              in: {
                _id: "$$participant._id",
                fullName: "$$participant.fullName",
                image: "$$participant.image"
              }
            }
          }
        }
      },
      {
        $project: {
          latestMessage: 1,
          groupName: 1,
          type: 1,
          groupAdmin: 1,
          image: 1,
          participants: 1
        }
      }
    ]);

    const totalResults = await Chat.countDocuments({ participants: participantId });
    const totalPages = Math.ceil(totalResults / limit);
    const pagination = { totalResults, totalPages, currentPage: page, limit };

    return { chatList, pagination };
  } catch (error) {
    console.error(error);
    throw error;
  }
};



const getChatById = async (chatId) => {
  return await Chat.findById(chatId);
}


const deleteChatByUserId = async (userId) => {
  const chat = await Chat.deleteMany({ participants: { $in: [userId] } });
  return chat;
}


module.exports = {
  addChat,
  getChatByParticipants,
  getChatByParticipantId,
  deleteChatByUserId,
  getChatById
}
