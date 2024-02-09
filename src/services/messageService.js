const Message = require('../models/Message');
const mongoose = require('mongoose');


const addMessage = async (messageBody) => {
  try {
    if (messageBody.participants.length <= 3) {
      messageBody.type = "group";  
    }
    const message = new Message(messageBody);
    await message.save();
    return message;
  } catch (error) {
    throw error;
  }
}

const getMessageByChatId = async (chatId) => {
  return await Message.findOne({chat: chatId});
}

module.exports = {
  addMessage,
  getMessageByChatId
}
