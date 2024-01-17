const express = require('express');
const { signUp, signIn, addWorker, getUsers, getWorkers, userDetails, forgetPassword, verifyForgetPasswordOTP, resetPassword, addPasscode, verifyPasscode, changePassword, blockUser, unBlockUser, signInWithPasscode, signInWithRefreshToken, updateProfile } = require('../controllers/userController');
const router = express.Router();
const fs = require('fs');
const userFileUploadMiddleware = require("../middlewares/fileUpload");

const UPLOADS_FOLDER_USERS = "./public/uploads/users";
const uploadUsers = userFileUploadMiddleware(UPLOADS_FOLDER_USERS);
const { isValidUser, verifyRefreshToken } = require('../middlewares/auth')
const  validationMiddleware = require('../middlewares/user/signupValidation');

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
router.post('/sign-up',  validationMiddleware, signUp);
router.post('/passcode', addPasscode);
router.post('/sign-in', signIn);
router.post('/sign-in-with-passcode', signInWithPasscode);
router.get('/sign-in-with-refresh-token', verifyRefreshToken, signInWithRefreshToken);
router.post('/verify-passcode', verifyPasscode);
router.post('/forget-password', forgetPassword);
router.post('/verify-otp', verifyForgetPasswordOTP);
router.post('/reset-password', resetPassword);
router.get('/', isValidUser, getUsers);
router.post('/workers', isValidUser, addWorker);
router.get('/workers', isValidUser, getWorkers)
router.patch('/block-user/:id', isValidUser, blockUser);
router.patch('/unblock-user/:id', isValidUser, unBlockUser);
router.get('/:id', isValidUser, userDetails);
router.patch('/change-password', isValidUser, changePassword);
router.put('/', [uploadUsers.single("image")], isValidUser, updateProfile);

module.exports = router;