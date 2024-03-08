require('dotenv').config();
const response = require("../helpers/response");
const logger = require("../helpers/logger");
const { addMultipleCommunityRequest, deleteCommunityRequest, getCommunityRequest, getCommunityRequestById } = require('../services/communityRequestService');
const { addChat, getChatByParticipants, addToCommunity, getChatById, getParticipantStatus, getCommunityStatusByUserId } = require('../services/chatService');
const { getUserById } = require('../services/userService');
const { addMessage } = require('../services/messageService');
const { addMultipleNofiications, addNotification } = require('../services/notificationService');
const { getQuestionById } = require('../services/questionService');

const addCommunityRequest = async (req, res) => {
  try {
    var { participants, category, groupName, question } = req.body;
    participants = JSON.parse(participants);
    if (req.body.userRole !== "user" && req.body.userSubscription !== "premium-plus") {
      return res.status(403).json(response({ status: 'Error', statusCode: '403', message: req.t('unauthorized') }));
    }
    const existingCom = await getCommunityStatusByUserId(req.body.userId, category, groupName);
    if (existingCom) {
      return res.status(400).json(response({ status: 'Error', statusCode: '400', message: req.t('already-exists'), data: existingCom }));
    }
    const chatData = {
      participants: [req.body.userId],
      category,
      groupName,
      type: "community",
      groupAdmin: req.body.userId
    }
    var newGroup = await await getChatByParticipants(chatData);
    if (!newGroup) {
      newGroup = await addChat(chatData);
    }
    const data = participants.map(participant => {
      return {
        chat: newGroup._id,
        user: participant,
        sendTo: 'user'
      }
    });

    const questionDetails = await getQuestionById(question);

    const newMessage = {
      chat: newGroup._id,
      message: questionDetails.question,
      sender: req.body.userId,
      messageType: "question"
    }
    const updatedMessage = await addMessage(newMessage);
    const eventName = `new-message::${newGroup._id.toString()}`;
    io.emit(eventName, updatedMessage);

    await addMultipleCommunityRequest(data);

    participants.forEach(async participant => {
      if (req.body.userId.toString() !== participant) {
        const notification = {
          message: `You have a new community request from ${groupName}`,
          receiver: participant,
          linkId: newGroup._id, // Assuming newGroup is defined elsewhere in your code
          type: 'community-request',
          role: 'user',
        };
        const updatedNotification = await addNotification(notification);
        const eventName = `user-notification::${participant}`;
        io.emit(eventName, updatedNotification);
      }
    });
    return res.status(200).json(response({ status: 'Success', statusCode: '200', message: req.t('community-request-sent'), data: newGroup }));
  }
  catch (error) {
    console.error(error);
    logger.error(error.message, req.originalUrl);
    return res.status(500).json(response({ status: 'Error', statusCode: '500', type: 'community-request', message: error.message }));
  }
}

const joinCommunity = async (req, res) => {
  try {
    const { chatId, question } = req.body;
    const getCommunity = await getChatById(chatId);
    if (!getCommunity) {
      return res.status(404).json(response({ status: 'Not Found', statusCode: '404', data: null }));
    }
    var existingCom = await getParticipantStatus(chatId, req.body.userId, "community");
    if (!existingCom) {
      existingCom = await addToCommunity(chatId, req.body.userId)
      const newMessage = {
        chat: chatId,
        sender: req.body.userId,
        message: req.body.userFullName + " has joined the chat",
        messageType: "notice"
      }
      const updatedMessage = await addMessage(newMessage);
      const eventName = `new-message::${chatId}`;
      //sending the join message to group
      io.emit(eventName, updatedMessage);
    }
    if (existingCom) {
      const questionDetails = await getQuestionById(question);
      const newMessage = {
        chat: chatId,
        message: questionDetails.question,
        sender: req.body.userId,
        messageType: "question"
      }
      const updatedMessage = await addMessage(newMessage);
      const eventName = `new-message::${chatId}`;
      io.emit(eventName, updatedMessage);
      return res.status(200).json(response({ status: 'Success', statusCode: '200', message: req.t('community-joined'), data: { chat: chatId } }));
    }
    return res.status(400).json(response({ status: 'Error', statusCode: '400', message: req.t('community-join-failed') }));
  }
  catch (error) {
    console.error(error);
    logger.error(error.message, req.originalUrl);
    return res.status(500).json(response({ status: 'Error', statusCode: '500', type: 'community-request', message: error.message }));
  }
}

const getCommunityRequestForUser = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const options = { page, limit };
    const filter = {
      user: req.body.userId,
      sendTo: "user",
      status: "pending"
    };
    const result = await getCommunityRequest(filter, options);
    return res.status(200).json(response({ status: 'Success', statusCode: '200', data: result, message: req.t('community-request') }));
  }
  catch (error) {
    console.error(error);
    logger.error(error.message, req.originalUrl);
    return res.status(500).json(response({ status: 'Error', statusCode: '500', type: 'community-request', message: error.message }));
  }
}

const seeCommunityRequest = async (req, res) => {
  try {
    const chat = req.body.chatId;
    const sendTo = req.body.sendTo;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const options = { page, limit };
    const filter = { chat, sendTo };
    const result = await getCommunityRequest(filter, options);
    return res.status(200).json(response({ status: 'Success', statusCode: '200', data: result }));
  }
  catch (error) {
    console.error(error);
    logger.error(error.message, req.originalUrl);
    return res.status(500).json(response({ status: 'Error', statusCode: '500', type: 'community-request', message: error.message }));
  }
}

const CommunityRequestDecision = async (req, res) => {
  try {
    const cmReq = await getCommunityRequestById(req.params.id)
    if (!cmReq) {
      return res.status(404).json(response({ status: 'Not Found', statusCode: '404', data: null }));
    }
    if (req.body.status === "accepted") {
      const newCommunity = await addToCommunity(cmReq.chat, req.body.userId);
      const newMessage = {
        chat: cmReq.chat,
        sender: req.body.userId,
        message: req.body.userFullName + " has joined the chat",
        messageType: "notice"
      }
      const updatedMessage = await addMessage(newMessage);
      const eventName = `new-message::${cmReq.chat}`;
      io.emit(eventName, updatedMessage);

      if (newCommunity) {
        await deleteCommunityRequest(cmReq._id)
        return res.status(200).json(response({ status: 'Success', statusCode: '200', type: 'community-request', message: req.t('community-request-accepted') }));
      }
    }
    if (req.body.status === "rejected") {
      await deleteCommunityRequest(cmReq._id)
      return res.status(200).json(response({ status: 'Success', statusCode: '200', type: 'community-request', message: req.t('community-request-rejected') }));
    }
    return res.status(400).json(response({ status: 'Error', statusCode: '400', type: 'decision-not-found', message: req.t('community-request-failed') }));
  }
  catch (error) {
    console.error(error);
    logger.error(error.message, req.originalUrl);
    return res.status(500).json(response({ status: 'Error', statusCode: '500', type: 'community-request', message: error.message }));
  }
}


module.exports = { addCommunityRequest, seeCommunityRequest, getCommunityRequestForUser, CommunityRequestDecision, joinCommunity }