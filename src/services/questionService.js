const Question = require('../models/Question');

const addQuestion = async (questionBody) => {
  try {
    const question = new Question(questionBody);
    await question.save();
    return question;
  } catch (error) {
    throw error;
  }
}

const getQuestionById = async (id) => {
  return await Question.findById(id);
}

const getQuestionByQuestionAndSubCategory = async (question, subCategory) => {
  return await Question.findOne({ question: question, subCategory: subCategory });
}

const getAllQuestions = async (filter, options) => {
  const {page=1, limit=10} = options;
  const skip = (page - 1) * limit;
  const questionList = await Question.find({...filter}).skip(skip).limit(limit).sort({createdAt: -1}).populate('category', 'name');
  const totalResults = await Question.countDocuments({...filter});
  const totalPages = Math.ceil(totalResults / limit);
  const pagination = {totalResults, totalPages, currentPage: page, limit};
  return {questionList, pagination};
}

const updateQuestion = async (questionId,questionbody) => {
  try{
    return await Question.findByIdAndUpdate(questionId, questionbody, { new: true });
  }
  catch(error){
    throw error;
  }
}

const deleteQuestion = async (questionId) => {
  try{
    return await Question.findByIdAndDelete(questionId);
  }
  catch(error){
    throw error;
  }
}

module.exports = {
  addQuestion,
  getQuestionById,
  updateQuestion,
  getQuestionByQuestionAndSubCategory,
  getAllQuestions,
  deleteQuestion
}