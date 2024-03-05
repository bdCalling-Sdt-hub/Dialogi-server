require('dotenv').config();
const response = require("../helpers/response");
const logger = require("../helpers/logger");
const { addDiscussion, getAllDiscussions, updateDiscussion, getDiscussionById, deleteDiscussion, addReply, getAllReplies, getDiscussionWithReplies } = require('../services/discussionService');

const addNewDiscussion = async (req, res) => {
  try{
    if(req.body.userRole!=='user'){
      return res.status(400).json(response({ status: 'Error', statusCode: '400', type: 'discussion', message: req.t('unauthorised') }));
    }
    req.body.user = req.body.userId;
    const reply = await addDiscussion(req.body);
    return res.status(201).json(response({ status: 'Success', statusCode: '201', type: 'reply', message: req.t('reply-added'), data: reply }));
  }
  catch(error){
    console.error(error);
    logger.error(error.message, req.originalUrl);
    return res.status(500).json(response({ status: 'Error', statusCode: '500', type: 'discussion', message: req.t('server-error') }));
  }
}

const addNewReply = async (req, res) => {
  try{
    if(req.body.userRole!=='user'){
      return res.status(400).json(response({ status: 'Error', statusCode: '400', type: 'discussion', message: req.t('unauthorised') }));
    }
    req.body.user = req.body.userId;
    const discussion = await addReply(req.body);
    return res.status(201).json(response({ status: 'Success', statusCode: '201', type: 'discussion', message: req.t('discussion-added'), data: discussion }));
  }
  catch(error){
    console.error(error);
    logger.error(error.message, req.originalUrl);
    return res.status(500).json(response({ status: 'Error', statusCode: '500', type: 'discussion', message: req.t('server-error') }));
  }
}

const updateDiscussionById = async (req, res) => {
  try{
    const discussion = await getDiscussionById(req.params.id);
    if(!discussion){
      return res.status(404).json(response({ status: 'Error', statusCode: '404', type: 'discussion', message: req.t('discussion-not-found') }));
    }
    const updatedDiscussion = await updateDiscussion(req.params.id, req.body);
    return res.status(200).json(response({ status: 'Success', statusCode: '200', type: 'discussion', message: req.t('discussion-updated'), data: updatedDiscussion }));
  }
  catch(error){
    console.error(error);
    logger.error(error.message, req.originalUrl);
    return res.status(500).json(response({ status: 'Error', statusCode: '500', type: 'discussion', message: req.t('server-error') }));
  }
}

const deleteDiscussionById = async (req, res) => {
  try{
    const discussion = await getDiscussionById(req.params.id);
    if(!discussion){
      return res.status(404).json(response({ status: 'Error', statusCode: '404', type: 'discussion', message: req.t('discussion-not-found') }));
    }
    await deleteDiscussion(req.params.id);
    return res.status(200).json(response({ status: 'Success', statusCode: '200', type: 'discussion', message: req.t('discussion-deleted') }));
  }
  catch(error){
    console.error(error);
    logger.error(error.message, req.originalUrl);
    return res.status(500).json(response({ status: 'Error', statusCode: '500', type: 'discussion', message: req.t('server-error') }));
  }
}

const getDiscussionDetails = async (req, res) => {
  try{
    const {page, limit} = req.query;
    const options = { page, limit };
    const discussion = await getDiscussionWithReplies(req.params.id, req.body.userId, options);
    return res.status(200).json(response({ status: 'Success', statusCode: '200', type: 'discussion', message: req.t('discussion-details'), data: discussion }));
  }
  catch(error){
    console.error(error);
    logger.error(error.message, req.originalUrl);
    return res.status(500).json(response({ status: 'Error', statusCode: '500', type: 'discussion', message: req.t('server-error') }));
  }
}

module.exports = { addNewDiscussion, updateDiscussionById, deleteDiscussionById, getDiscussionDetails, addNewReply}