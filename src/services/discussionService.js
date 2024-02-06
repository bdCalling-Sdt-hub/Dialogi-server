const Discussion = require('../models/Discussion');
const Reply = require('../models/Reply');

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
    return reply;
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

  const replyList = await Reply.find({ ...filter }).skip(skip).limit(limit).sort({ createdAt: -1 });
  const totalResults = await Reply.countDocuments({ ...filter });
  const totalPages = Math.ceil(totalResults / limit);
  const pagination = { totalResults, totalPages, currentPage: page, limit };
  return { replyList, pagination };
};

const getAllDiscussions = async (filter, options) => {
  const page = Number(options.page) || 1;
  const limit = Number(options.limit) || 10;
  const skip = (page - 1) * limit;

  const pipeline = [
    {
      $match: filter
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
        localField: '_id',
        foreignField: 'discussion',
        as: 'replies'
      }
    },
    {
      $addFields: {
        totalReplies: { $size: "$replies" } // Adding totalReplies field to each discussion with the count of replies
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
        'user': { $arrayElemAt: ['$user', 0] } // Get the first element of the user array
      }
    },
    {
      $project: {
        discussion: 1,
        likes: 1,
        dislikes: 1,
        'user.fullName': 1,
        'user.image': 1,
        replies: {
          $map: {
            input: "$replies",
            as: "reply",
            in: {
              reply: "$$reply.reply",
              likes: "$$reply.likes",
              dislikes: "$$reply.dislikes",
              user: {
                fullName: "$$reply.user.fullName",
                image: "$$reply.user.image"
              }
            }
          }
        }
      }
    }
  ];

  const discussionListWithReplies = await Discussion.aggregate(pipeline);
  const totalResults = await Discussion.countDocuments(filter);
  const totalPages = Math.ceil(totalResults / limit);
  const pagination = { totalResults, totalPages, currentPage: page, limit };
  
  return { discussionList: discussionListWithReplies, pagination };
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

module.exports = {
  addDiscussion,
  getDiscussionById,
  updateDiscussion,
  getAllDiscussions,
  deleteDiscussion,
  getAllReplies,
  addReply
}
