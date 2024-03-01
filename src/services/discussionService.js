const Discussion = require('../models/Discussion');
const Reply = require('../models/Reply');
const mongoose = require('mongoose');


const addDiscussion = async (discussionBody) => {
  try {
    const discussion = new Discussion(discussionBody);
    await discussion.save();
    return discussion;
  } catch (error) {
    throw error;
  }
}

const addReply = async (replyBody) => {
  try {
    const reply = new Reply(replyBody);
    await reply.save();

    // Populate the user field of the saved reply
    const savedReply = await reply.populate('user', 'fullName image');

    // Construct the desired return object
    const formattedReply = {
      reply: savedReply.reply,
      user: {
        fullName: savedReply.user.fullName,
        image: savedReply.user.image
      },
      likes: savedReply.likes,
      dislikes: savedReply.dislikes
    };

    return formattedReply;
  } catch (error) {
    throw error;
  }
}


const getDiscussionById = async (id) => {
  return await Discussion.findById(id);
}

const getAllReplies = async (filter, options) => {
  const page = Number(options.page) || 1;
  const limit = Number(options.limit) || 10;
  const skip = (page - 1) * limit;

  const replyList = await Reply.find({ ...filter }).skip(skip).limit(limit).sort({ createdAt: -1 }).populate('discussion', 'discussion').populate('user', 'fullName image');
  const totalResults = await Reply.countDocuments({ ...filter });
  const totalPages = Math.ceil(totalResults / limit);
  const pagination = { totalResults, totalPages, currentPage: page, limit };
  return { replyList, pagination };
};

const getAllDiscussions = async (filter, options) => {
  const page = Number(options.page) || 1;
  const limit = Number(options.limit) || 10;
  const skip = (page - 1) * limit;
  const question = new mongoose.Types.ObjectId(filter.question);

  const pipeline = [
    {
      $match: {
        "question": question
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $skip: skip
    },
    {
      $limit: limit
    },
    {
      $lookup: {
        from: 'replies',
        let: { discussion_id: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$discussion', '$$discussion_id']
              }
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
              user: { $arrayElemAt: ['$user', 0] }
            }
          },
          {
            $project: {
              reply: 1,
              likes: 1,
              dislikes: 1,
              'user.fullName': 1,
              'user.image': 1
            }
          },
          {
            $limit: 3 // Limit the number of replies to 3
          }
        ],
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
        'user': { $arrayElemAt: ['$user', 0] }
      }
    },
    {
      $lookup: {
        from: 'questions', // Assuming your questions collection is named 'questions'
        localField: 'question',
        foreignField: '_id',
        as: 'question'
      }
    },
    {
      $addFields: {
        'question': { $arrayElemAt: ['$question', 0] }
      }
    },
    {
      $project: {
        discussion: 1,
        likes: 1,
        dislikes: 1,
        'user.fullName': 1,
        'user.image': 1,
        replies: 1,
        'question.question': 1
      }
    }
  ];

  const discussionListWithReplies = await Discussion.aggregate(pipeline);
  const totalResults = await Discussion.countDocuments(filter);
  const totalPages = Math.ceil(totalResults / limit);
  const pagination = { totalResults, totalPages, currentPage: page, limit };

  return { discussionList: discussionListWithReplies, pagination };
};

// const getDiscussionWithReplies = async (discussionId, options) => {
//   const page = Number(options.page) || 1;
//   const limit = Number(options.limit) || 10;
//   const skip = (page - 1) * limit;

//   const discussion = await Discussion.findById(discussionId).select('discussion likes dislikes user createdAt').populate('user', 'fullName image');

//   if (!discussion) {
//     return null;
//   }

//   const replies = await Reply.find({ discussion: discussionId })
//     .skip(skip)
//     .limit(limit)
//     .select('reply likes dislikes user')
//     .populate('user', 'fullName image')

//   const totalResults = await Reply.countDocuments({ discussion: discussionId });
//   const totalPages = Math.ceil(totalResults / limit);
//   const pagination = { totalResults, totalPages, currentPage: page, limit };

//   // Create a structure similar to the provided example
//   const formattedReplies = replies.map(reply => ({
//     _id: reply._id,
//     reply: reply.reply,
//     user: {
//       fullName: reply.user.fullName,
//       image: reply.user.image,
//       _id: reply.user._id
//     },
//     likes: reply.likes,
//     dislikes: reply.dislikes,
//     createdAt: reply.createdAt
//   }));

//   const formattedDiscussion = {
//     _id: discussion._id,
//     discussion: discussion.discussion,
//     user: discussion.user,
//     likes: discussion.likes,
//     dislikes: discussion.dislikes,
//     replies: formattedReplies,
//     createdAt: discussion.createdAt
//   };

//   return { discussion: formattedDiscussion, pagination };
// };


const getDiscussionWithReplies = async (discussionId, userId, options) => {
  const page = Number(options.page) || 1;
  const limit = Number(options.limit) || 10;
  const skip = (page - 1) * limit;

  const mongoDiscussionId = new mongoose.Types.ObjectId(discussionId);
  const mongoUserId = new mongoose.Types.ObjectId(userId);

  const pipeline = [
    { $match: { _id: mongoDiscussionId } },
    {
      $lookup: {
        from: 'likes',
        let: { discussionId: '$_id', userId: mongoUserId },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$discussion', mongoDiscussionId] },
                  { $eq: ['$user', mongoUserId] }
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
        let: { discussionId: '$_id', userId: mongoUserId },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$discussion', '$$discussionId'] },
                  { $eq: ['$user', '$$userId'] }
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
      $lookup: {
        from: 'replies',
        let: { discussionId: '$_id', userId: mongoUserId },
        pipeline: [
          { $match: { $expr: { $eq: ['$discussion', '$$discussionId'] } } },
          { $sort: { createdAt: -1 } },
          { $skip: skip },
          { $limit: limit },
          {
            $lookup: {
              from: 'users',
              localField: 'user',
              foreignField: '_id',
              as: 'user'
            }
          },
          { $unwind: '$user' },
          {
            $lookup: {
              from: 'likes',
              let: { replyId: '$_id', userId: mongoUserId },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$reply', '$replyId'] },
                        { $eq: ['$user','$userId'] }
                      ]
                    }
                  }
                }
              ],
              as: 'userLikes'
            }
          },
          {
            $lookup: {
              from: 'dislikes',
              let: { replyId: '$_id', userId: mongoUserId },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ['$reply', '$$replyId'] },
                        { $eq: ['$user', mongoUserId] }
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
              isLiked: { $cond: { if: { $gt: [{ $size: '$userLikes' }, 0] }, then: true, else: false } },
              isDisliked: { $cond: { if: { $gt: [{ $size: '$userDislikes' }, 0] }, then: true, else: false } }
            }
          },
          {
            $project: {
              _id: 1,
              reply: 1,
              user: { fullName: '$user.fullName', image: '$user.image', _id: '$user._id' },
              likes: 1,
              dislikes: 1,
              createdAt: 1,
              isLiked: 1,
              isDisliked: 1
            }
          }
        ],
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
    { $unwind: '$user' },
    {
      $project: {
        _id: 1,
        discussion: 1,
        user: { fullName: '$user.fullName', image: '$user.image', _id: '$user._id' },
        likes: 1,
        dislikes: 1,
        replies: 1,
        createdAt: 1,
        isLiked: '$isLiked',
        isDisliked: '$isDisliked',
        userLikes: 1,
      }
    }
  ];

  const [discussion] = await Discussion.aggregate(pipeline);

  if (!discussion) {
    return null;
  }

  const totalResults = await Reply.countDocuments({ discussion: discussionId });
  const totalPages = Math.ceil(totalResults / limit);
  const pagination = { totalResults, totalPages, currentPage: page, limit };

  return { discussion, pagination };
};



const updateDiscussion = async (discussionId, discussionbody) => {
  try {
    return await Discussion.findByIdAndUpdate(discussionId, discussionbody, { new: true });
  }
  catch (error) {
    throw error;
  }
}

const deleteDiscussion = async (discussionId) => {
  try {
    return await Discussion.findByIdAndDelete(discussionId);
  }
  catch (error) {
    throw error;
  }
}

const deleteDiscussionByUserId = async (userId) => {
  try {
    return await Discussion.deleteMany({ user: userId});
  }
  catch (error) {
    throw error;
  }
}

const getReplyById = async (id) => {
  return await Reply.findById(id);
}

module.exports = {
  addDiscussion,
  getDiscussionById,
  updateDiscussion,
  getAllDiscussions,
  deleteDiscussion,
  getAllReplies,
  addReply,
  getDiscussionWithReplies,
  deleteDiscussionByUserId,
  getReplyById
}
