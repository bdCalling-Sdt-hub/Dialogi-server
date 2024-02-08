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

const getAllSubCategories = async (filter, options) => {
  const page = Number(options.page) || 1;
  const limit = Number(options.limit) || 10;
  const skip = (page - 1) * limit;
  const subCategoryList = await Question.find({ ...filter }).skip(skip).limit(limit).select('subCategory').sort({ createdAt: -1 });
  const totalResults = await Question.countDocuments({ ...filter });
  const totalPages = Math.ceil(totalResults / limit);
  const pagination = { totalResults, totalPages, currentPage: page, limit };
  return { subCategoryList, pagination };
}

const getQuestionByQuestionAndSubCategory = async (question, subCategory) => {
  return await Question.findOne({ question: question, subCategory: subCategory });
}

const getAllQuestions = async (filter, options) => {
  const page = Number(options.page) || 1;
  const limit = Number(options.limit) || 10;
  const skip = (page - 1) * limit;

  const questionsList = await Question.find({ ...filter }).skip(skip).limit(limit).select('question');
  const totalResults = await Question.countDocuments({ ...filter });
  const totalPages = Math.ceil(totalResults / limit);
  const pagination = { totalResults, totalPages, currentPage: page, limit };
  return { questionsList, pagination };
}

const updateQuestion = async (questionId, questionbody) => {
  try {
    return await Question.findByIdAndUpdate(questionId, questionbody, { new: true });
  }
  catch (error) {
    throw error;
  }
}

const deleteQuestion = async (questionId) => {
  try {
    return await Question.findByIdAndDelete(questionId);
  }
  catch (error) {
    throw error;
  }
}

module.exports = {
  addQuestion,
  getQuestionById,
  updateQuestion,
  getQuestionByQuestionAndSubCategory,
  getAllQuestions,
  deleteQuestion,
  getAllSubCategories
}
