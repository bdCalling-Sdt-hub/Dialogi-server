const CommunityRequest = require('../models/CommunityRequest');

const addNewCommunityRequest = async (communityRequestBody) => {
  try {
    const communityRequest = new CommunityRequest(communityRequestBody);
    await communityRequest.save();
    return communityRequest;
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
    const communityRequestList =  await CommunityRequest.find(filters).select('chat').populate('chat createdAt', 'groupName image').skip(skip).limit(limit).sort({createdAt: -1});
    const totalResults = await CommunityRequest.countDocuments(filters);
    const totalPages = Math.ceil(totalResults / limit);
    const pagination = { totalResults, totalPages, currentPage: page, limit };
    return { communityRequestList, pagination };
  } catch (error) {
    throw error;
  }
}

const getCommunityRequestById = async (id)=>{
  try{
    return await CommunityRequest.findById(id)
  }
  catch(err){
    throw err;
  }
}

const deleteCommunityRequestByUser = async (userId) => {
  try {
    return await CommunityRequest.deleteMany({ sender: userId });
  } catch (error) {
    throw error;
  }
}

module.exports = {
  addNewCommunityRequest,
  deleteCommunityRequest,
  getCommunityRequest,
  getCommunityRequestById,
  deleteCommunityRequestByUser
}
