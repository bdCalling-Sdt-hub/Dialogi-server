require('dotenv').config();
const response = require("../helpers/response");
const logger = require("../helpers/logger");
const { getFriendByParticipantId, addFriend, getFriendByParticipants, updateFriend, getFriendById } = require('../services/frinedService');

const makeFriend = async (req, res) => {
  try{
    if(req.body.userRole!=='user'){
      return res.status(400).json(response({ status: 'Error', statusCode: '400', type: 'friend', message: req.t('unauthorised') }));
    }
    const participants = [req.body.userId, req.body.participantId];
    const existingFriend = await getFriendByParticipants(participants);
    if(existingFriend){
      return res.status(400).json(response({ status: 'Error', statusCode: '400', type: 'friend', message: req.t('already-friend') }));
    }
    const data = {
      participants,
      status: 'pending',
      sender: req.body.userId
    }
    const friend = await addFriend(data);
    return res.status(201).json(response({ status: 'Success', statusCode: '201', type: 'friend', message: req.t('friend-added'), data: friend }));
  }
  catch(error){
    console.error(error);
    logger.error(error.message, req.originalUrl);
    return res.status(500).json(response({ status: 'Error', statusCode: '500', type: 'friend', message: req.t('server-error') }));
  }
}

const getAllFriends = async (req, res) => {
  try{
    const { page, limit, status } = req.query;
    const options = { page, limit };
    const filter = {
      participants: { $in: [req.body.userId] },
      status: !status ? 'accepted' : status
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

const updateFriendStatus = async (req, res) => {
  try{
    if(req.body.userRole!=='user'){
      return res.status(400).json(response({ status: 'Error', statusCode: '400', type: 'friend', message: req.t('unauthorised') }));
    }
    const friend = await getFriendById(req.params.id);
    getFriendByParticipants([req.body.userId, req.body.participantId]);
    if(!friend){
      return res.status(404).json(response({ status: 'Error', statusCode: '404', type: 'friend', message: req.t('friend-not-found') }));
    }
    const {status} = req.body;
    if(status!=='accepted' && status!=='rejected'){
      return res.status(400).json(response({ status: 'Error', statusCode: '400', type: 'friend', message: req.t('invalid-status') }));
    }
    const updatedFriend = await updateFriend(friend._id, {
      status: req.body.status
    });
    return res.status(200).json(response({ status: 'Success', statusCode: '200', type: 'friend', message: req.t('friend-updated'), data: updatedFriend }));
  }
  catch(error){
    console.error(error);
    logger.error(error.message, req.originalUrl);
    return res.status(500).json(response({ status: 'Error', statusCode: '500', type: 'friend', message: req.t('server-error') }));
  }
}



module.exports = { getAllFriends, makeFriend, updateFriendStatus }