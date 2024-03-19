const User = require('../models/User');
const bcrypt = require('bcryptjs');

const addUser = async (userBody) => {
  try {
    const user = new User(userBody);
    await user.save();
    return user;
  } catch (error) {
    throw error;
  }
}

const getUserById = async (id) => {
  try {
    return await User.findById(id);
  }
  catch (error) {
    throw error;
  }
}

const getUserByEmail = async (email) => {
  try {
    return await User.findOne({ email });
  }
  catch (error) {
    throw error;
  }
}

const getAllUsers = async (filter, options) => {
  try {
    const { page = 1, limit = 10 } = options;
    console.log(filter);
    const skip = (page - 1) * limit;
    const userList = await User.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 });
    const totalResults = await User.countDocuments(filter);
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalPages = Math.ceil(totalResults / limit);
    const pagination = { totalResults, totalPages, currentPage: page, limit, totalUsers };
    return { userList, pagination };
  }
  catch (error) {
    throw error;
  }
}

const getSpecificUsers = async (filter, options) => {
  try {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;
    const userList = await User.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 });
    const totalResults = await User.countDocuments(filter);
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalPages = Math.ceil(totalResults / limit);
    const pagination = { totalResults, totalPages, currentPage: page, limit, totalUsers };
    return { userList, pagination };
  }
  catch (error) {
    throw error;
  }
}

const login = async (email, password, purpose) => {
  try {

    console.log(email, password, purpose);

    const user = await User.findOne({ email });
    if (!user) {
      return null;
    }
    if (user && user.loginInWithProvider === true && (purpose === "changePass" || purpose === "deleteAccount")) {
      return user;
    }
    if (user && user.loginInWithProvider === true && purpose === "signIn") {
      return null;
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return null;
    }
    return user;
  }
  catch (error) {
    throw error;
  }
}

const deleteAccount = async (userId) => {
  try {
    const userData = await User.findById(userId);
    if(userData){
      userData.email = userData.email+" (Account is deleted), Joining Time: "+userData.createdAt;
      userData.fullName = "Dialogi User"
      userData.image = `/uploads/users/deletedAccount.png`
      userData.isDeleted = true;
      userData.save();
    }
    console.log(userData);
    return
  }
  catch (error) {
    throw error;
  }
}

const updateUser = async (userId, userbody) => {
  try {
    return await User.findByIdAndUpdate(userId, userbody, { new: true });
  }
  catch (error) {
    throw error;
  }
}

module.exports = {
  addUser,
  login,
  getUserById,
  updateUser,
  getUserByEmail,
  getAllUsers,
  deleteAccount,
  getSpecificUsers
}
