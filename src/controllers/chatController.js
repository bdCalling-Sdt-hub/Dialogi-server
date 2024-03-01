require('dotenv').config();
const response = require("../helpers/response");
const logger = require("../helpers/logger");
const { getChatByParticipantId, getChatMembersByChatId, getChat } = require('../services/chatService');

const getAllChats = async (req, res) => {
  try{
    const { page, limit } = req.query;
    const options = { page, limit };
    const filter = {
      participantId : req.body.userId
    };
    const chats = await getChatByParticipantId(filter, options);
    return res.status(200).json(response({ status: 'Success', statusCode: '200', message: req.t('chats'), data: chats }));
  }
  catch(error){
    console.error(error);
    logger.error(error.message, req.originalUrl);
    return res.status(500).json(response({ status: 'Error', statusCode: '500', type: 'chat', message: req.t('server-error') }));
  }
}

const getChatMembers = async (req, res) => {
  try{
    const filter = {
      chat : req.params.id
    };
    const chat = await getChatMembersByChatId(filter);
    return res.status(200).json(response({ status: 'Success', statusCode: '200', message: req.t('chat-members'), data: chat }));
  }
  catch(error){
    console.error(error);
    logger.error(error.message, req.originalUrl);
    return res.status(500).json(response({ status: 'Error', statusCode: '500', type: 'chat', message: req.t('server-error') }));
  }
}

const getCommunities = async (req, res) => {
  try{
    if(req.body.userRole!=="user"){
      return res.status(403).json(response({ status: 'Error', statusCode: '403', message: req.t('unauthorized') }));
    }
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const category = req.query.category;
    const options = { page, limit };
    const filter = {
      category : category,
      type : "community"
    }
    const community = await getChat(filter, options);
    return res.status(200).json(response({ status: 'Success', statusCode: '200', message: req.t('community'), data: community }));
  }
  catch(error){
    console.error(error);
    logger.error(error.message, req.originalUrl);
    return res.status(500).json(response({ status: 'Error', statusCode: '500', type: 'chat', message: req.t('server-error') }));
  }
}

module.exports = { getAllChats, getChatMembers, getCommunities }