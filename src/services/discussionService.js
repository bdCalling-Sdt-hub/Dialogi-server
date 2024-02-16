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
      $project: {
        discussion: 1,
        likes: 1,
        dislikes: 1,
        'user.fullName': 1,
        'user.image': 1,
        replies: 1,
      }
    }
  ];

  const discussionListWithReplies = await Discussion.aggregate(pipeline);
  
  // Fetch the question separately
  const questionData = await Question.findOne({ _id: question }, { question: 1 });
  
  // Merge the question with each discussion
  discussionListWithReplies.forEach(discussion => {
    discussion.question = questionData.question;
  });

  const totalResults = await Discussion.countDocuments(filter);
  const totalPages = Math.ceil(totalResults / limit);
  const pagination = { totalResults, totalPages, currentPage: page, limit };

  return { discussionList: discussionListWithReplies, pagination };
};


const getDiscussionWithReplies = async (discussionId, options) => {
  const page = Number(options.page) || 1;
  const limit = Number(options.limit) || 10;
  const skip = (page - 1) * limit;

  const discussion = await Discussion.findById(discussionId).select('discussion likes dislikes user').populate('user', 'fullName image');

  if (!discussion) {
    return null;
  }

  const replies = await Reply.find({ discussion: discussionId })
    .skip(skip)
    .limit(limit)
    .select('reply likes dislikes user')
    .populate('user', 'fullName image')

  const totalResults = await Reply.countDocuments({ discussion: discussionId });
  const totalPages = Math.ceil(totalResults / limit);
  const pagination = { totalResults, totalPages, currentPage: page, limit };

  // Create a structure similar to the provided example
  const formattedReplies = replies.map(reply => ({
    _id: reply._id,
    reply: reply.reply,
    user: {
      fullName: reply.user.fullName,
      image: reply.user.image
    },
    likes: reply.likes,
    dislikes: reply.dislikes
  }));

  const formattedDiscussion = {
    _id: discussion._id,
    discussion: discussion.discussion,
    user: discussion.user,
    likes: discussion.likes,
    dislikes: discussion.dislikes,
    replies: formattedReplies,
  };

  return { discussion: formattedDiscussion, pagination };
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
  addReply,
  getDiscussionWithReplies
}
