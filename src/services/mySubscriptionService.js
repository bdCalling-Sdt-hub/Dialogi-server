const MySubscription = require('../models/MySubscription');
const { getSubscriptionById } = require('./subscriptionService');
const { getUserById } = require('./userService');

const addMySubscription = async (MysubscriptionBody) => {
  try {
    var mySubs = await getMySubscriptionByUserId(MysubscriptionBody.user);
    if (mySubs) {
      MysubscriptionBody.expiryTime = mySubs.expiryTime+MysubscriptionBody.expiryTime;
      MysubscriptionBody.questionAccessNumber = mySubs.questionAccessNumber+MysubscriptionBody.questionAccessNumber;
      MysubscriptionBody.categoryAccessNumber = mySubs.categoryAccessNumber+MysubscriptionBody.categoryAccessNumber;
      return await updateMySubscription(mySubs._id, MysubscriptionBody);
    }
    mySubs = new MySubscription(MysubscriptionBody);
    await mySubs.save();
    return mySubs;
  } catch (error) {
    throw error;
  }
}

const addDefaultSubscription = async (userId) => {
  try {
    const defaultSubs = await getSubscriptionById("65cde4e7294393c969cff434");
    const user = await getUserById(userId);
    
    user.subscription = "default";
    user.subscriptionId = defaultSubs._id;
    await user.save();

    const myUpdatedSubs = new MySubscription(
    {
      user: user._id,
      type: defaultSubs?.type,
      isAddAvailable: defaultSubs?.isAddAvailable,
      categoryAccessNumber: defaultSubs?.categoryAccessNumber,
      isCategoryAccessUnlimited: defaultSubs.isCategoryAccessUnlimited,
      questionAccessNumber: defaultSubs.questionAccessNumber,
      isQuestionAccessUnlimited: defaultSubs.isQuestionAccessUnlimited,
      isChatAvailable: defaultSubs.isChatAvailable,
      isGroupChatAvailable: defaultSubs.isGroupChatAvailable,
      isCommunityDiscussionAvailable: defaultSubs.isCommunityDiscussionAvailable,
      isEarlyAccessAvailable: defaultSubs.isEarlyAccessAvailable,
      updateProfileAccess: defaultSubs.updateProfileAccess,
      expiryTime: defaultSubs.expiryTime,
    });
    return await myUpdatedSubs.save();
  }
  catch (error) {
    throw error;
  }
}


const getMySubscriptionById = async (id) => {
  try {
    return await MySubscription.findById(id);
  }
  catch (error) {
    throw error;
  }
}

const getMySubscriptionByUserId = async (userId) => {
  try {
    return await MySubscription.findOne({ user: userId });
  }
  catch (error) {
    throw error;
  }
}

const getAllMySubscriptions = async (filter, options) => {
  try {
    const page = Number(options.page) || 1;
    const limit = Number(options.limit) || 10;
    const skip = (page - 1) * limit;

    const MysubscriptionsList = await MySubscription.find({ ...filter }).limit(limit).skip(skip);
    const totalResults = await MySubscription.countDocuments({ ...filter });
    const totalPages = Math.ceil(totalResults / limit);
    const pagination = { totalResults, totalPages, currentPage: page, limit };
    return { MysubscriptionsList, pagination };
  }
  catch (error) {
    throw error;
  }
}

const updateMySubscription = async (MysubscriptionId, Mysubscriptionbody) => {
  try {
    return await MySubscription.findByIdAndUpdate(MysubscriptionId, Mysubscriptionbody, { new: true });
  }
  catch (error) {
    throw error;
  }
}

const deleteMySubscription = async (MysubscriptionId) => {
  try {
    return await MySubscription.findByIdAndDelete(MysubscriptionId);
  }
  catch (error) {
    throw error;
  }
}

module.exports = {
  addMySubscription,
  getMySubscriptionById,
  updateMySubscription,
  getAllMySubscriptions,
  deleteMySubscription,
  getMySubscriptionByUserId,
  addDefaultSubscription
}
