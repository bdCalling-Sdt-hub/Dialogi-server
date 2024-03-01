const CommunityRequest = require('../models/CommunityRequest');

const addMultipleCommunityRequest = async (data) => {
  try {
    return await CommunityRequest.insertMany(data, { ordered: false });
  } catch (error) {
    throw error;
  }
}

const deleteCommunityRequest = async (id) => {
  try {
    return await CommunityRequest.findByIdAndDelete(id);
  } catch (error) {
    throw error;
  }
}

const getCommunityRequest = async (filters, options) => {
  try {
    const {page=1, limit=10} = options;
    const skip = (page - 1) * limit;
    const communityRequestList =  await CommunityRequest.find(filters).select('user status').populate('user', 'fullName image').skip(skip).limit(limit);
    const totalResults = await CommunityRequest.countDocuments(filters);
    const totalPages = Math.ceil(totalResults / limit);
    const pagination = { totalResults, totalPages, currentPage: page, limit };
    return { communityRequestList, pagination };
  } catch (error) {
    throw error;
  }
}

module.exports = {
  addMultipleCommunityRequest,
  deleteCommunityRequest,
  getCommunityRequest
}
