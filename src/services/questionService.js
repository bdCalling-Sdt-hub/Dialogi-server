const { default: mongoose } = require('mongoose');
const Question = require('../models/Question');
const Discussion = require('../models/Discussion');

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
  const category = new mongoose.Types.ObjectId(filter.category);

  try {
    // Aggregate pipeline to get subcategories with count
    const aggregationPipeline = [
      { $match: { category: category } },
      { $group: { _id: { subCategory: '$subCategory', _id: '$_id' }, count: { $sum: 1 } } },
      { $project: { _id: 0, subCategory: '$_id.subCategory', _id: '$_id._id', count: 1 } }, // Project to reshape documents
      { $skip: skip },
      { $limit: limit }
    ];

    // Execute aggregation pipeline
    const subCategoryList = await Question.aggregate(aggregationPipeline);

    // Count total results
    const totalResults = await Question.countDocuments(filter);

    // Calculate total pages
    const totalPages = Math.ceil(totalResults / limit);

    // Construct pagination object
    const pagination = { totalResults, totalPages, currentPage: page, limit };

    return { subCategoryList, pagination };
  } catch (error) {
    console.error('Error:', error);
    throw new Error('Failed to fetch subcategories.');
  }
}


const getQuestionByQuestionAndSubCategory = async (question, subCategory) => {
  return await Question.findOne({ question: question, subCategory: subCategory });
}

const getAllQuestions = async (filter, options) => {
  const page = Number(options.page) || 1;
  const questionlimit = 1;
  const skip = (page - 1) * questionlimit;

  const discussionPage = Number(options.discussionPage) || 1;
  const discussionLimit = Number(options.discussionLimit) || 3;
  const discussionSkip = (discussionPage - 1) * discussionLimit;

  const category = new mongoose.Types.ObjectId(filter.category);
  const subCategory = filter.subCategory;
  
  const questions = await Question.aggregate([
    { $match: { 
      category: category,
      subCategory: subCategory
    } },
    { $skip: skip },
    { $limit: questionlimit },
    {
      $lookup: {
        from: 'discussions',
        let: { questionId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$question', '$$questionId'] }
            }
          },
          {
            $lookup: {
              from: 'replies',
              localField: '_id',
              foreignField: 'discussion',
              as: 'replies'
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: 'user',
              foreignField: '_id',
              as: 'user'
            }
          },
          {
            $addFields: {
              user: { $arrayElemAt: ["$user", 0] }
            }
          },
          {
            $addFields: {
              totalReplies: { $size: '$replies' },
            }
          },
          {
            $project: {
              totalReplies: 1,
              likes: 1,
              dislikes: 1,
              discussion: 1,
              user: { fullName: "$user.fullName", image: "$user.image", _id: "$user._id" }
            }
          },
          { $skip: discussionSkip },
          { $limit: discussionLimit }
        ],
        as: 'discussions'
      },
    },
    {
      $project:{
        question: 1,
        subCategory: 1,
        discussions: 1,
      }
    }
  ]);

  // Calculate pagination for questions
  const totalResults = await Question.countDocuments(filter);
  const totalPages = Math.ceil(totalResults / questionlimit);
  const pagination = { totalResults, totalPages, currentPage: page, limit:questionlimit };

  // Calculate pagination for discussions for each question
  const discussionPagination = [];
  for (const question of questions) {
    const totalDiscussionResults = await Discussion.countDocuments({ question: question._id });
    const totalDiscussionPages = Math.ceil(totalDiscussionResults / discussionLimit);
    discussionPagination.push({ totalResults: totalDiscussionResults, totalPages: totalDiscussionPages, currentPage: discussionPage, limit: discussionLimit });
  }

  return {questions, pagination, discussionPagination};
};


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
