require('dotenv').config();
const response = require("../helpers/response");
const logger = require("../helpers/logger");
const { getChatByParticipantId, getChatMembersByChatId, getChat, getChatById, leaveGroup, getParticipantStatus } = require('../services/chatService');
const { addMessage } = require('../services/messageService');
const { getUserById } = require('../services/userService');

const getAllChats = async (req, res) => {
  try {
    const { page, limit, type } = req.query;
    const options = { page, limit };
    const filter = {
      participantId: req.body.userId,
      type: !type ? 'single' : type
    };
    const chats = await getChatByParticipantId(filter, options);
    return res.status(200).json(response({ status: 'Success', statusCode: '200', message: req.t('chats'), data: chats }));
  }
  catch (error) {
    console.error(error);
    logger.error(error.message, req.originalUrl);
    return res.status(500).json(response({ status: 'Error', statusCode: '500', type: 'chat', message: req.t('server-error') }));
  }
}

const getChatMembers = async (req, res) => {
  try {
    const filter = {
      chat: req.params.id
    };
    const chat = await getChatMembersByChatId(filter);
    return res.status(200).json(response({ status: 'Success', statusCode: '200', message: req.t('chat-members'), data: chat }));
  }
  catch (error) {
    console.error(error);
    logger.error(error.message, req.originalUrl);
    return res.status(500).json(response({ status: 'Error', statusCode: '500', type: 'chat', message: req.t('server-error') }));
  }
}

const getCommunities = async (req, res) => {
  try {
    if (req.body.userRole !== "user") {
      return res.status(403).json(response({ status: 'Error', statusCode: '403', message: req.t('unauthorized') }));
    }
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const category = req.query.category;
    const options = { page, limit };
    const filter = {
      category: category,
      type: "community"
    }
    const community = await getChat(filter, options);
    return res.status(200).json(response({ status: 'Success', statusCode: '200', message: req.t('community'), data: community }));
  }
  catch (error) {
    console.error(error);
    logger.error(error.message, req.originalUrl);
    return res.status(500).json(response({ status: 'Error', statusCode: '500', type: 'chat', message: req.t('server-error') }));
  }
}

const leaveFromGroup = async (req, res) => {
  try {
    const chatId = (req.params.id).toString();
    const type = req.body.type;
    const chat = await getChatById(chatId);
    if (!chat) {
      return res.status(404).json(response({ status: 'Not Found', statusCode: '404', message: req.t('not-found') }));
    }
    const existingStatus = await getParticipantStatus(chatId, req.body.userId, type);
    if (!existingStatus) {
      return res.status(404).json(response({ status: 'Not Found', statusCode: '404', message: req.t('member-not-found') }));
    }
    const result = await leaveGroup(chatId, req.body.userId);

    if (result) {
      const newMessage = {
        chat: chatId,
        message: req.body.userFullName + " has left the chat",
        sender: req.body.userId,
        messageType:"notice"
      }
      const updatedMessage = await addMessage(newMessage);
      console.log(updatedMessage);
      const eventName = `new-message::${chatId}`;

      //sending the leave message to group
      io.emit(eventName, updatedMessage);
      return res.status(200).json(response({ status: 'Success', statusCode: '200', message: req.t('left-group') }));
    }
    else {
      return res.status(404).json(response({ status: 'Not Found', statusCode: '404', message: req.t('not-found') }));
    }
  }
  catch (error) {
    console.error(error);
    logger.error(error.message, req.originalUrl);
    return res.status(500).json(response({ status: 'Error', statusCode: '500', type: 'chat', message: req.t('server-error') }));
  }
}

const kickMember = async (req, res) => {
  try {
    const chatId = req.params.id;
    const userId = req.body.participant;
    const type = req.body.type;
    const chat = await getChatById(chatId);
    if (!chat) {
      return res.status(404).json(response({ status: 'Not Found', statusCode: '404', message: req.t('not-found') }));
    }
    if (chat.groupAdmin.toString() !== req.body.userId) {
      return res.status(403).json(response({ status: 'Error', statusCode: '403', message: req.t('unauthorized') }));
    }

    const existingStatus = await getParticipantStatus(chatId, userId, type);
    if (!existingStatus) {
      return res.status(404).json(response({ status: 'Not Found', statusCode: '404', message: req.t('member-not-found') }));
    }
    const result = await leaveGroup(chatId, userId);
    if (result) {
      const userData = await getUserById(userId);
      const newMessage = {
        chat: chatId,
        message: "Admin has kicked " + userData.fullName + " from the chat",
        sender: req.body.userId,
        messageType:"notice"
      }
      const updatedMessage = await addMessage(newMessage);
      const eventName = `new-message::${chatId}`;
      io.emit(eventName, updatedMessage);
      return res.status(200).json(response({ status: 'Success', statusCode: '200', message: req.t('kicked-member') }));
    }
    else {
      return res.status(404).json(response({ status: 'Not Found', statusCode: '404', message: req.t('not-found') }));
    }
  }
  catch (error) {
    console.error(error);
    logger.error(error.message, req.originalUrl);
    return res.status(500).json(response({ status: 'Error', statusCode: '500', type: 'chat', message: req.t('server-error') }));
  }
}

const updateGroupName = async (req, res) => {
  try {
    const chatId = req.params.id;
    const chat = await getChatById(chatId);
    if (!chat) {
      return res.status(404).json(response({ status: 'Not Found', statusCode: '404', message: req.t('not-found') }));
    }
    chat.groupName = req.body.name;
    const updatedChat = await chat.save();
    const newMessage = {
      chat: chatId,
      message: "Group name has been updated to " + req.body.name,
      sender: req.body.userId,
      messageType:"notice"
    }
    const updatedMessage = await addMessage(newMessage);
    const eventName = `new-message::${chatId}`;
    io.emit(eventName, updatedMessage);

    return res.status(200).json(response({ status: 'Success', statusCode: '200', message: req.t('group-name-updated'), data: updatedChat }));
  }
  catch (error) {
    console.error(error);
    logger.error(error.message, req.originalUrl);
    return res.status(500).json(response({ status: 'Error', statusCode: '500', type: 'chat', message: req.t('server-error') }));

  }
}

module.exports = { getAllChats, getChatMembers, getCommunities, kickMember, leaveFromGroup, updateGroupName }