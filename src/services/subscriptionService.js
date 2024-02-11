const Subscription = require('../models/Subscription');

const addSubscription = async (subscriptionBody) => {
  try {
    const subscription = new Subscription(subscriptionBody);
    await subscription.save();
    return subscription;
  } catch (error) {
    throw error;
  }
}

const getSubscriptionById = async (id) => {
  return await Subscription.findById(id);
}

const getAllSubscriptions = async (filter, options) => {
  const page = Number(options.page) || 1;
  const limit = Number(options.limit) || 10;
  const skip = (page - 1) * limit;

  const subscriptionsList = await Subscription.find({ ...filter }).limit(limit).skip(skip);
  const totalResults = await Subscription.countDocuments({ ...filter });
  const totalPages = Math.ceil(totalResults / limit);
  const pagination = { totalResults, totalPages, currentPage: page, limit };
  return {subscriptionsList, pagination};
}

const updateSubscription = async (subscriptionId, subscriptionbody) => {
  try {
    return await Subscription.findByIdAndUpdate(subscriptionId, subscriptionbody, { new: true });
  }
  catch (error) {
    throw error;
  }
}

const deleteSubscription = async (subscriptionId) => {
  try {
    return await Subscription.findByIdAndDelete(subscriptionId);
  }
  catch (error) {
    throw error;
  }
}

module.exports = {
  addSubscription,
  getSubscriptionById,
  updateSubscription,
  getAllSubscriptions,
  deleteSubscription,
}
