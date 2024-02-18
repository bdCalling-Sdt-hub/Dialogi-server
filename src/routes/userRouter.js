const express = require('express');
const { signUp, signIn, getUsers, userDetails, forgetPassword, verifyForgetPasswordOTP, resetPassword, changePassword, blockUser, unBlockUser, signInWithRefreshToken, updateProfile, getProfileDetails, deleteAccount } = require('../controllers/userController');
const router = express.Router();
const fs = require('fs');
const userFileUploadMiddleware = require("../middlewares/fileUpload");

const UPLOADS_FOLDER_USERS = "./public/uploads/users";
const uploadUsers = userFileUploadMiddleware(UPLOADS_FOLDER_USERS);
const { isValidUser, verifyRefreshToken } = require('../middlewares/auth')
const  validationMiddleware = require('../middlewares/user/signupValidation');
const convertHeicToPng = require('../middlewares/converter');

if (!fs.existsSync(UPLOADS_FOLDER_USERS)) {
  // If not, create the folder
  fs.mkdirSync(UPLOADS_FOLDER_USERS, { recursive: true }, (err) => {
      if (err) {
          console.error("Error creating uploads folder:", err);
      } else {
          console.log("Uploads folder created successfully");
      }
  });
} else {
  console.log("Uploads folder already exists");
}

//Sign-up user
router.post('/sign-up', [uploadUsers.single("image")], convertHeicToPng(UPLOADS_FOLDER_USERS), validationMiddleware, signUp);
router.post('/sign-in', signIn);
router.get('/sign-in-with-refresh-token', verifyRefreshToken, signInWithRefreshToken);
router.post('/forget-password', forgetPassword);
router.post('/verify-otp', verifyForgetPasswordOTP);
router.post('/reset-password', resetPassword);
router.get('/', isValidUser, getUsers);
router.get('/profile-details/:id', isValidUser, getProfileDetails);
router.patch('/block-user/:id', isValidUser, blockUser);
router.patch('/unblock-user/:id', isValidUser, unBlockUser);
router.get('/:id', isValidUser, userDetails);
router.patch('/change-password', isValidUser, changePassword);
router.put('/', [uploadUsers.single("image")], isValidUser, updateProfile);
router.delete('/', isValidUser, deleteAccount);

module.exports = router;