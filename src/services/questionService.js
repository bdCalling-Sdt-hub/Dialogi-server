const { default: mongoose } = require('mongoose');
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
  const limit = Number(options.limit) || 10;
  const skip = (page - 1) * limit;
  const category = new mongoose.Types.ObjectId(filter.category);
  const subCategory = filter.subCategory;
  const questions = await Question.aggregate([
    { $match: { 
      category: category,
      subCategory: subCategory
     } },
    { $skip: skip },
    { $limit: limit },
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
            $addFields: {
              totalReplies: { $size: '$replies' },
              limitedReplies: { $slice: ['$replies', 3] }
            }
          },
          {
            $unwind: "$limitedReplies"
          },
          {
            $lookup: {
              from: 'users',
              localField: 'limitedReplies.user',
              foreignField: '_id',
              as: 'limitedReplies.user'
            }
          },
          {
            $group: {
              _id: "$_id",
              limitedReplies: { $push: "$limitedReplies" },
              totalReplies: { $first: "$totalReplies" }
            }
          },
          {
            $project: {
              totalReplies: 1,
              limitedReplies: {
                $slice: ["$limitedReplies", 3]
              }
            }
          },
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
  return questions;
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
