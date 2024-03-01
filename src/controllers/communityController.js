require('dotenv').config();
const response = require("../helpers/response");
const logger = require("../helpers/logger");
const { addMultipleCommunityRequest, deleteCommunityRequest, getCommunityRequest } = require('../services/communityRequestService');
const { addChat, getChatByParticipants } = require('../services/chatService');

const addCommunityRequest = async (req, res) => {
  try{
    const {participants, category, groupName } = req.body;
    console.log(req.body, participants);
    if(req.body.userRole!=="user" && req.body.userSubscription!=="premium-plus"){
      return res.status(403).json(response({ status: 'Error', statusCode: '403', message: req.t('unauthorized') }));
    }
    const chatData = {
      participants:[req.body.userId],
      category,
      groupName,
      type: "community",
      groupAdmin: req.body.userId
    }
    var newGroup = await await getChatByParticipants(chatData);
    if(!newGroup){
      newGroup = await addChat(chatData);
    }
    const data = participants.map(participant => {
      return {
        chat: newGroup._id,
        user: participant
      }
    });
    const result = await addMultipleCommunityRequest(data);
    return res.status(200).json(response({ status: 'Success', statusCode: '200', message: req.t('community-request-sent'), data: result }));
  }
  catch(error){
    console.error(error);
    logger.error(error.message, req.originalUrl);
    return res.status(500).json(response({ status: 'Error', statusCode: '500', type: 'community-request', message: error.message }));
  }
}

const acceptCommunityRequest = async (req, res) => {
  try{
    const { chatId, userId } = req.body;
    const result = await deleteCommunityRequest(chatId);
    return res.status(200).json(response({ status: 'Success', statusCode: '200', message: req.t('community-request-accepted'), data: result }));
  }
  catch(error){
    console.error(error);
    logger.error(error.message, req.originalUrl);
    return res.status(500).json(response({ status: 'Error', statusCode: '500', type: 'community-request', message: error.message }));
  }
}

const seeCommunityRequest = async (req, res) => {
  try{
    const chat = req.body.chatId;
    const sentTo = req.body.sentTo;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const options = { page, limit };
    const filter = { chat, sentTo };
    const result = await getCommunityRequest(filter, options);
    return res.status(200).json(response({ status: 'Success', statusCode: '200', data: result }));
  }
  catch(error){
    console.error(error);
    logger.error(error.message, req.originalUrl);
    return res.status(500).json(response({ status: 'Error', statusCode: '500', type: 'community-request', message: error.message }));
  }
}


module.exports = { addCommunityRequest, seeCommunityRequest }