require('dotenv').config();
const response = require("../helpers/response");
const logger = require("../helpers/logger");
const { getFriendByParticipantId, addFriend, getFriendByParticipants } = require('../services/frinedService');

const getAllFriends = async (req, res) => {
  try{
    const { page, limit, type } = req.query;
    const options = { page, limit };
    const filter = {
      participantId : req.body.userId,
      type: !type ? 'accepted' : type
    };
    const friends = await getFriendByParticipantId(filter, options);
    return res.status(200).json(response({ status: 'Success', statusCode: '200', message: req.t('friends'), data: friends }));
  }
  catch(error){
    console.error(error);
    logger.error(error.message, req.originalUrl);
    return res.status(500).json(response({ status: 'Error', statusCode: '500', type: 'chat', message: req.t('server-error') }));
  }
}

module.exports = { getAllFriends }