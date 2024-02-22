const Message = require('../models/Message');

const addMessage = async (messageBody) => {
  try {
    const message = new Message(messageBody);
    await message.save();
    return message.populate('sender', 'fullName image');
  } catch (error) {
    throw error;
  }
}

const getMessageByChatId = async (filters, options) => {
  const page = Number(options.page) || 1;
  const limit = Number(options.limit) || 10;
  const skip = (page - 1) * limit;
  console.log(filters);
  const messageList = await Message.find({chat: filters.chat}).populate('sender', 'fullName image').limit(limit).skip(skip).sort({createdAt: -1});
  const totalResults = await Message.countDocuments(filters);
  const totalPages = Math.ceil(totalResults / limit);
  const pagination = { totalResults, totalPages, currentPage: page, limit };
  return { messageList, pagination };
}

const deleteMessageByUserId = async (userId) => {
  return await Message.deleteMany({ sender: userId});
}

module.exports = {
  addMessage,
  getMessageByChatId,
  deleteMessageByUserId
}
