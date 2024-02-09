const Chat = require('../models/Chat');
const mongoose = require('mongoose');


const addChat = async (chatBody) => {
  try {
    if (chatBody.participants.length <= 3) {
      chatBody.type = "group";  
    }
    const chat = new Chat(chatBody);
    await chat.save();
    return chat;
  } catch (error) {
    throw error;
  }
}

const getChatByParticipants = async (participants) => {
  return await Chat.findOne({participants:{ $all: participants}});
}

module.exports = {
  addChat,
  getChatByParticipants
}
