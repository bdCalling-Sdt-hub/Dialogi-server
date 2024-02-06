require('dotenv').config();
const response = require("../helpers/response");
const logger = require("../helpers/logger");
const { addQuestion, getAllQuestions, updateQuestion, getQuestionByQuestionAndSubCategory, getQuestionById, deleteQuestion } = require('../services/questionService');

const addNewQuestion = async (req, res) => {
  try{
    if(req.body.userRole!=='admin'){
      return res.status(400).json(response({ status: 'Error', statusCode: '400', type: 'question', message: req.t('unauthorised') }));
    }
    const existingQuestion = await getQuestionByQuestionAndSubCategory(req.body.question, req.body.subCategory);
    if(existingQuestion){
      return res.status(400).json(response({ status: 'Error', statusCode: '400', type: 'question', message: req.t('question-exists') }));
    }
    const question = await addQuestion(req.body);
    return res.status(201).json(response({ status: 'Success', statusCode: '201', type: 'question', message: req.t('question-added'), data: question }));
  }
  catch(error){
    console.error(error);
    logger.error(error.message, req.originalUrl);
    return res.status(500).json(response({ status: 'Error', statusCode: '500', type: 'question', message: req.t('server-error') }));
  }
}

const allQuestions = async (req, res) => {
  try{
    const { page, limit } = req.query;
    const options = { page, limit };
    const filter = {};
    const questions = await getAllQuestions(filter, options);
    return res.status(200).json(response({ status: 'Success', statusCode: '200', message: req.t('questions'), data: questions }));
  }
  catch(error){
    console.error(error);
    logger.error(error.message, req.originalUrl);
    return res.status(500).json(response({ status: 'Error', statusCode: '500', type: 'question', message: req.t('server-error') }));
  }
}

const updateQuestionById = async (req, res) => {
  try{
    const question = await getQuestionById(req.params.id);
    if(!question){
      return res.status(404).json(response({ status: 'Error', statusCode: '404', type: 'question', message: req.t('question-not-found') }));
    }
    const updatedQuestion = await updateQuestion(req.params.id, req.body);
    return res.status(200).json(response({ status: 'Success', statusCode: '200', type: 'question', message: req.t('question-updated'), data: updatedQuestion }));
  }
  catch(error){
    console.error(error);
    logger.error(error.message, req.originalUrl);
    return res.status(500).json(response({ status: 'Error', statusCode: '500', type: 'question', message: req.t('server-error') }));
  }
}

const deleteQuestionById = async (req, res) => {
  try{
    const question = await getQuestionById(req.params.id);
    if(!question){
      return res.status(404).json(response({ status: 'Error', statusCode: '404', type: 'question', message: req.t('question-not-found') }));
    }
    await deleteQuestion(req.params.id);
    return res.status(200).json(response({ status: 'Success', statusCode: '200', type: 'question', message: req.t('question-deleted') }));
  }
  catch(error){
    console.error(error);
    logger.error(error.message, req.originalUrl);
    return res.status(500).json(response({ status: 'Error', statusCode: '500', type: 'question', message: req.t('server-error') }));
  }
}

const getQuestionDetails = async (req, res) => {
  try{
    const question = await getQuestionById(req.params.id);
    if(!question){
      return res.status(404).json(response({ status: 'Error', statusCode: '404', type: 'question', message: req.t('question-not-found') }));
    }
    return res.status(200).json(response({ status: 'Success', statusCode: '200', type: 'question', message: req.t('question-details'), data: question }));
  }
  catch(error){
    console.error(error);
    logger.error(error.message, req.originalUrl);
    return res.status(500).json(response({ status: 'Error', statusCode: '500', type: 'question', message: req.t('server-error') }));
  }
}

module.exports = { addNewQuestion, allQuestions, updateQuestionById, deleteQuestionById, getQuestionDetails }