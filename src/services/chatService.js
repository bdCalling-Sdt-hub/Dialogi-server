const { error } = require('../helpers/logger');
const Chat = require('../models/Chat');
const mongoose = require('mongoose');
const Message = require('../models/Message');
const CommunityRequest = require('../models/CommunityRequest');

const addChat = async (chatBody) => {
  try {
    const chat = new Chat(chatBody);
    await chat.save();
    return chat;
  } catch (error) {
    throw error;
  }
}

const addToCommunity = async (chatId, userId) => {
  try {
    console.log('chatId--->', chatId, userId);
    const result =  await Chat.updateOne(
      { _id: chatId },
      { $push: { participants: userId } }
    );
    console.log('result--->', result);
    if (result.modifiedCount === 1) {
      console.log(`Participant with ID ${userId} joined the chat.`);
      return true;
    } else {
      console.log(`Participant with ID ${userId} can not joined the chat.`);
      return false;
    }

  } catch (error) {
    console.error('Error adding participant to chat:', error);
  }
}

const getParticipantStatus = async (chatId, userId, type) => {
  try {
    return await Chat.findOne({ _id: chatId, participants: userId, type });
  }
  catch(error){
    throw error;
  }
}

const getChatByParticipants = async (data) => {
  try{
    const filters = {
      participants: {
        $all: data.participants
      },
      type: !data.type ? 'single' : data.type,
    }
    if(data.groupName){
      filters.groupName = data.groupName;
    }
    const ndata = await Chat.findOne(filters);
    return ndata;
  }
  catch(error){
    throw error;
  }
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
    if(filters.type === 'community'){
      type = 'community';
    }
    else{
      type = { $ne: 'community' };
    }

    const chatList = await Chat.aggregate([
      { $match: { participants: participantId, type } },
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

const getChatMembersByChatId = async (filters) => {
  const chatId = filters.chat;
  
  const chat = await Chat.findById(chatId).populate('participants', 'fullName image');
  if(chat && chat.participants?.length > 0){
    return chat.participants;
  }
  return null;
}

const leaveGroup = async (chatId, userId) => {
  try {
    const result = await Chat.updateOne(
      { _id: chatId },
      { $pull: { participants: userId } }
    );
    console.log('result--->', result);
    // Check if the update was successful
    if (result.modifiedCount === 1) {
      console.log(`Participant with ID ${userId} removed from chat.`);
      return true;
    } else {
      console.log(`Participant with ID ${userId} not found in chat.`);
      return false;
    }
  } catch (error) {
    throw error;
  }
}

const getChatById = async (chatId) => {
  return await Chat.findById(chatId);
}

const getChat = async (filters, options) => {
  const { page=1, limit=10 } = options;
  const skip = (page - 1) * limit;
  console.log('filters--->', filters);
  const chatList = await Chat.find(filters).limit(limit).skip(skip).sort({createdAt: -1}).select('groupName image');
  const totalResults = await Chat.countDocuments(filters);
  const totalPages = Math.ceil(totalResults / limit);
  const pagination = { totalResults, totalPages, currentPage: page, limit };
  return { chatList, pagination };
}

const deleteChatById = async (chatId) => {
  const chat = await Chat.findByIdAndDelete(chatId);
  await Message.deleteMany({ chat: chatId });
  await CommunityRequest.deleteMany({ chat: chatId })
  return chat;
}

const deleteChatForDeletedUser= async (userId) => {
  await Chat.deleteMany({groupAdmin: userId, type:{$in:["group","community"]}});
  await Chat.updateMany({ participants: { $in: [userId] } }, { $pull: { participants: userId } });
  await CommunityRequest.deleteMany({ user: userId });
  return;
}

const getCommunityStatusByUserId = async (userId, category, groupName) => {
  try{
    return await Chat.findOne({ participants: {$in: [userId]}, type: 'community', groupAdmin: userId, groupName: groupName, category: category });
  }
  catch(error){
    throw error
  }
}

module.exports = {
  addChat,
  getCommunityStatusByUserId,
  getChat,
  addToCommunity,
  leaveGroup,
  getChatByParticipants,
  getChatByParticipantId,
  deleteChatById,
  getChatById,
  getChatMembersByChatId,
  getParticipantStatus,
  deleteChatForDeletedUser
}
