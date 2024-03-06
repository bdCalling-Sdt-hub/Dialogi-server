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
  var earlyAccess;
  if(filter.accessStatus){
    if(filter.accessStatus==='true'){
      earlyAccess = true;
    }
    else{
      earlyAccess = false;
    }
  }

  const matchCriteria = {
    category: category,
  }
  if(filter.accessStatus){
    matchCriteria.isEarlyAccessAvailable = earlyAccess;
  }

  try {
    // Aggregate pipeline to get subcategories with count
    const aggregationPipeline = [
      { $match:  matchCriteria},
      { $group: { _id: { subCategory: '$subCategory' }, count: { $sum: 1 } } },
      { $project: { _id: 0, subCategory: '$_id.subCategory', count: 1 } }, // Project to reshape documents
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
  const userId = new mongoose.Types.ObjectId(filter.userId);
  const subCategory = filter.subCategory;
  var matchData = {
    category: category,
    subCategory: subCategory
  }
  var accessStatus = false;
  if(filter.accessStatus!==undefined){
    accessStatus = filter.accessStatus==='true'?true:false;
    matchData.isEarlyAccessAvailable = accessStatus;
  }

  const questions = await Question.aggregate([
    {
      $match: matchData
    },
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
            $lookup: {
              from: 'likes',
              let: { discussionId: '$_id', userId: userId },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$discussion', '$$discussionId'] },
                        { $eq: ['$user', userId] }
                      ]
                    }
                  }
                }
              ],
              as: 'userLikes'
            }
          },
          {
            $addFields: {
              isLiked: { $cond: { if: { $gt: [{ $size: '$userLikes' }, 0] }, then: true, else: false } }
            }
          },
          {
            $lookup: {
              from: 'dislikes',
              let: { discussionId: '$_id', userId: userId },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$discussion', '$$discussionId'] },
                        { $eq: ['$user', userId] }
                      ]
                    }
                  }
                }
              ],
              as: 'userDislikes'
            }
          },
          {
            $addFields: {
              isDisliked: { $cond: { if: { $gt: [{ $size: '$userDislikes' }, 0] }, then: true, else: false } }
            }
          },
          {
            $project: {
              totalReplies: 1,
              likes: 1,
              dislikes: 1,
              discussion: 1,
              createdAt: 1,
              user: { fullName: "$user.fullName", image: "$user.image", _id: "$user._id" },
              isLiked: 1,
              isDisliked: 1
            }
          },
          { $skip: discussionSkip },
          { $limit: discussionLimit }
        ],
        as: 'discussions'
      }
    },
    {
      $lookup: {
        from: 'favourites',
        let: { questionId: '$_id', userId: userId },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$question', '$$questionId'] },
                  { $eq: ['$user', userId] } // Match favorites of the specific user
                ]
              }
            }
          }
        ],
        as: 'userFavourites'
      }
    },
    {
      $addFields: {
        isFavourite: { $gt: [{ $size: '$userFavourites' }, 0] }
      }
    },
    {
      $project: {
        question: 1,
        questionGr: 1,
        isEarlyAccessAvailable: 1,
        subCategory: 1,
        discussions: 1,
        isFavourite: 1,
      }
    }
  ]);

  // Calculate pagination for questions
  const totalResults = await Question.countDocuments(matchData);
  console.log(filter)
  const totalPages = Math.ceil(totalResults / questionlimit);
  const pagination = { totalResults, totalPages, currentPage: page, limit: questionlimit };

  // Calculate pagination for discussions for each question
  var discussionPagination = {};
  for (const question of questions) {
    const totalDiscussionResults = await Discussion.countDocuments({ question: question._id });
    const totalDiscussionPages = Math.ceil(totalDiscussionResults / discussionLimit);
    discussionPagination = { totalResults: totalDiscussionResults, totalPages: totalDiscussionPages, currentPage: discussionPage, limit: discussionLimit };
  }

  return { questions, pagination, discussionPagination };
};

const getSubCategoryBySubCatName = async (filters, options) => {
  const limit = Number(options.limit) || 10;
  try {
    const subCategoryList = await Question.find(filters).limit(limit).select('subCategory');
    return subCategoryList;
  } catch (error) {
    throw error;
  }

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
  getAllSubCategories,
  getSubCategoryBySubCatName
}
