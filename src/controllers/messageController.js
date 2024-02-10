require('dotenv').config();
const response = require("../helpers/response");
const logger = require("../helpers/logger");
const { getMessageByChatId } = require('../services/messageService');

const getAllMessages = async (req, res) => {
  try{
    const { page, limit } = req.query;
    const options = { page, limit };
    const chatId = req.params.chatId;
    const filter = {
      chat : chatId
    };
    const chats = await getMessageByChatId(filter, options);
    return res.status(200).json(response({ status: 'Success', statusCode: '200', message: req.t('chats'), data: chats }));
  }
  catch(error){
    console.error(error);
    logger.error(error.message, req.originalUrl);
    return res.status(500).json(response({ status: 'Error', statusCode: '500', type: 'chat', message: req.t('server-error') }));
  }
}

module.exports = { getAllMessages }