const Message = require('../models/Message');

const addMessage = async (messageBody) => {
  try {
    const message = new Message(messageBody);
    await message.save();
    return message.populate({ path: 'chat', select: 'participants' });
  } catch (error) {
    throw error;
  }
}

const getMessageByChatId = async (filters, options) => {
  const page = Number(options.page) || 1;
  const limit = Number(options.limit) || 10;
  const skip = (page - 1) * limit;

  return await Message.findOne({chat: chatId}).limit(limit).skip(skip).sort({createdAt: -1});
}

const deleteMessageByUserId = async (userId) => {
  return await Message.deleteMany({ sender: userId});
}

module.exports = {
  addMessage,
  getMessageByChatId,
  deleteMessageByUserId
}
