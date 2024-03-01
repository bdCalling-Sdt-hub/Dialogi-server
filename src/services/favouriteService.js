const Favourite = require('../models/Favourite');

const upgradeFavourite = async (favouriteBody) => {
  try {
    var favourite = await getFavouriteByUser(favouriteBody);
    if (favourite) {
      await deleteFavourite(favourite._id);
      return { message: 'remove-favourite', data: favourite };
    }
    favourite = new Favourite(favouriteBody);
    await favourite.save();
    return { message: 'add-favourite', data: favourite };
  } catch (error) {
    throw error;
  }
}

const getFavouriteByUser = async (favouriteBody) => {
  return await Favourite.findOne({ user: favouriteBody.user, question: favouriteBody.question });
}

const getFavouriteList = async (filters, options) => {
  const page = Number(options.page) || 1;
  const limit = Number(options.limit) || 10;
  const skip = (page - 1) * limit;
  const favouriteList = await Favourite.find(filters).limit(limit).skip(skip).populate('question', 'question').select('question');
  const totalResults = await Favourite.countDocuments(filters);
  const totalPages = Math.ceil(totalResults / limit);
  const pagination = { totalResults, totalPages, currentPage: page, limit };
  return { favouriteList, pagination };
}

const deleteFavourite = async (favouriteId) => {
  try {
    return Favourite.findByIdAndDelete(favouriteId);
  }
  catch (error) {
    throw error;
  }
}

const deleteFavouriteByUserId = async (userId) => {
  try {
    return await Favourite.deleteMany({ user: userId });
  }
  catch (error) {
    throw error;
  }
}



module.exports = {
  upgradeFavourite,
  getFavouriteList,
  deleteFavourite,
  deleteFavouriteByUserId
}
