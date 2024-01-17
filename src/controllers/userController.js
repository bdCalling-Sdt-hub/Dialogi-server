require('dotenv').config();
const response = require("../helpers/response");
const jwt = require('jsonwebtoken');
require('dotenv').config();
//defining unlinking image function 
const unlinkImages = require('../common/image/unlinkImage')
const logger = require("../helpers/logger");
const { addUser, login, getUserByEmail, getAllUsers, getUserById, updateUser, loginWithPasscode } = require('../services/userService')
const { sendOTP, checkOTPByEmail, verifyOTP, checkOTPValidity, updateOTP } = require('../services/otpService');
const { addNotification } = require('../services/notificationService');
const { addToken, verifyToken, deleteToken } = require('../services/tokenService');
const emailWithNodemailer = require('../helpers/email');
const crypto = require('crypto');

function validatePassword(password) {
  const hasNumber = /\d/.test(password);
  const hasLetter = /[a-zA-ZÀ-ÖØ-öø-ÿ]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  return password.length >= 8 && hasNumber && (hasLetter || hasSpecialChar);
}

//Sign up
const signUp = async (req, res) => {
  try {
    var otpPurpose = 'email-verification';
    var existingUser = false;
    if(req.body.existingUser){
      existingUser = true;
      otpPurpose = 'passcode-verification';
    }
    var { fullName, email, phoneNumber, password, country } = req.body;
    var otp
    if (req.headers['otp'] && req.headers['otp'].startsWith('OTP ')) {
      otp = req.headers['otp'].split(' ')[1];
    }
    if (!otp) {
      const existingOTP = await checkOTPByEmail(email);
      if (existingOTP) {
        console.log('OTP already exists', existingOTP);
        return res.status(200).json(response({ status: 'OK', statusCode: '200', type: 'user', message: req.t('otp-exists'), data: null }));
      }
      const otpData = await sendOTP(fullName, email, 'email', otpPurpose);
      if (otpData) {
        return res.status(200).json(response({ status: 'OK', statusCode: '200', type: 'user', message: req.t('otp-sent'), data: null }));
      }
    }
    else {
      const otpData = await verifyOTP(email, 'email', otpPurpose, otp);
      if (!otpData) {
        return res.status(400).json(response({ status: 'Error', statusCode: '400', type: 'user', message: req.t('invalid-otp') }));
      }
      var passcodeToken;
      var registeredUser;
      var message
      if(existingUser){
        registeredUser = req.body.existingUser;
        passcodeToken = crypto.randomBytes(32).toString('hex');
        message = req.t('user-reregistered');
      }
      else{
        const userData = {
          fullName: fullName,
          email: email,
          phoneNumber: phoneNumber,
          password: password,
          role: "user",
        }
        if(country){
          userData.country = country;
        }
        registeredUser = await addUser(userData);
        var message = "New user registered named " + fullName;
        const notification = {
          message: message,
          linkId: registeredUser._id,
          type: 'user',
          role: 'admin',
        }
        const sendNotification = await addNotification(notification);
        io.emit('russend-admin-notification', sendNotification)
        message = req.t('user-verified');
        passcodeToken = crypto.randomBytes(32).toString('hex');
      }
      const data = {
        token: passcodeToken,
        userId: registeredUser._id,
        purpose: 'passcode-verification',
      }
      await addToken(data);
      return res.status(201).json(response({ status: 'OK', statusCode: '201', type: 'user', message: message, data: registeredUser, passcodeToken: passcodeToken }));
    }
  } catch (error) {
    console.error(error);
    logger.error(error, req.originalUrl)
    return res.status(500).json(response({ status: 'Error', statusCode: '500', type: 'user', message: req.t('server-error') }));
  }
};

//Sign in
const signIn = async (req, res) => {
  try {
    //Get email password from req.body
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json(response({ statusCode: 200, message: req.t('login-credentials-required'), status: "OK" }));
    }

    const user = await login(email, password);

    if (user) {
      var token;
      var refreshToken;
      var passcodeToken;
      if (user.role === 'user') {
        passcodeToken = crypto.randomBytes(32).toString('hex');
        const data = {
          token: passcodeToken,
          userId: user._id,
          purpose: 'passcode-verification',
        }
        await addToken(data);
      }
      else {
        token = jwt.sign({ _id: user._id, email: user.email, role: user.role }, process.env.JWT_ACCESS_TOKEN, { expiresIn: '1d' });
        refreshToken = jwt.sign({ _id: user._id, email: user.email, role: user.role }, process.env.JWT_REFRESH_TOKEN, { expiresIn: '5y' });
      }
      
      return res.status(200).json(response({ statusCode: 200, message: req.t('login-success'), status: "OK", type: "user", data: user, accessToken: token, refreshToken: refreshToken, passcodeToken: passcodeToken }));
    }
    return res.status(401).json(response({ statusCode: 200, message: req.t('login-failed'), status: "OK" }));

  } catch (error) {
    console.error(error);
    logger.error(error, req.originalUrl)
    return res.status(500).json(response({ statusCode: 200, message: req.t(error), status: "Error" }));
  }
};

const signInWithRefreshToken = async (req, res) => {
  try {
    const user = await getUserById(req.body.userId);
    if (!user) {
      return res.status(404).json(response({ status: 'Error', statusCode: '404', type: 'user', message: req.t('user-not-exists') }));
    }
    const accessToken = jwt.sign({ _id: user._id, email: user.email, role: user.role }, process.env.JWT_ACCESS_TOKEN, { expiresIn: '1d' });
    return res.status(200).json(response({ status: 'OK', statusCode: '200', type: 'user', message: req.t('login-success'), data: user, token: accessToken }));
  } catch (error) {
    console.error(error);
    logger.error(error, req.originalUrl)
    return res.status(500).json(response({ statusCode: 200, message: req.t('server-error'), status: "Error" }));
  }
};

const forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await getUserByEmail(email)
    if (!user) {
      return res.status(404).json(response({ status: 'Error', statusCode: '404', type: 'user', message: req.t('user-not-exists') }));
    }
    const otpData = await sendOTP(user.fullName, email, 'email', 'forget-password');
    if (otpData) {
      return res.status(200).json(response({ status: 'OK', statusCode: '200', type: 'user', message: req.t('forget-password-sent') }));
    }
    return res.status(400).json(response({ status: 'Error', statusCode: '400', type: 'user', message: req.t('forget-password-error') }));
  }
  catch (error) {
    console.error(error);
    logger.error(error, req.originalUrl)
    return res.status(500).json(response({ statusCode: 200, message: req.t('server-error'), status: "Error" }));
  }
}

const verifyForgetPasswordOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(404).json(response({ status: 'Error', statusCode: '404', type: 'user', message: req.t('user-not-exists') }));
    }
    const otpVerified = await verifyOTP(email, 'email', 'forget-password', otp);
    if (!otpVerified) {
      return res.status(400).json(response({ status: 'Error', statusCode: '400', type: 'user', message: req.t('invalid-otp') }));
    }
    const token = crypto.randomBytes(32).toString('hex');
    const data = {
      token: token,
      userId: user._id,
      purpose: 'forget-password'
    }
    await addToken(data); 
    return res.status(200).json(response({ status: 'OK', statusCode: '200', type: 'user', message: req.t('otp-verified'), forgetPasswordToken: token }));
  }
  catch (error) {
    console.error(error);
    logger.error(error, req.originalUrl)
    return res.status(500).json(response({ statusCode: 200, message: req.t('server-error'), status: "Error" }));
  }
}

const resetPassword = async (req, res) => {
  try {
    var forgetPasswordToken
    if (req.headers['forget-password'] && req.headers['forget-password'].startsWith('Forget-password ')) {
      forgetPasswordToken = req.headers['forget-password'].split(' ')[1];
    }
    if(!forgetPasswordToken){
      return res.status(401).json(response({ status: 'Error', statusCode: '400', type: 'user', message: req.t('unauthorised') }));
    }

    const tokenData = await verifyToken(forgetPasswordToken, 'forget-password');
    if(!tokenData){
      return res.status(400).json(response({ status: 'Error', statusCode: '400', type: 'user', message: req.t('invalid-token') }));
    }
    const { email, password } = req.body;
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(404).json(response({ status: 'Error', statusCode: '404', type: 'user', message: req.t('user-not-exists') }));
    }
    const isValidPassword = validatePassword(password);
    if (!isValidPassword) {
      return res.status(400).json(response({ status: 'Error', statusCode: '400', type: 'user', message: req.t('password-format-error') }));
    }
    user.password = password;
    await user.save();
    await deleteToken(tokenData._id);
    return res.status(200).json(response({ status: 'OK', statusCode: '200', type: 'user', message: req.t('password-reset-success') }));
  }
  catch (error) {
    console.error(error);
    logger.error(error, req.originalUrl)
    return res.status(500).json(response({ statusCode: 200, message: req.t('server-error'), status: "Error" }));
  }
}

const addWorker = async (req, res) => {
  try {
    const { fullName, email, phoneNumber, country } = req.body;
    if (req.body.userRole !== 'admin') {
      return res.status(401).json(response({ statusCode: 401, message: req.t('unauthorised'), status: "Error" }));
    }
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json(response({ status: 'Error', statusCode: '409', type: 'user', message: req.t('user-exists') }));
    }
    const length = 8;
    // Generate a random password
    const password = crypto.randomBytes(length).toString('hex').slice(0, length);
    const user = {
      fullName,
      email,
      phoneNumber,
      password,
      role: "worker"
    };
    if(country){
      user.country = country;
    }
    const userSaved = await addUser(user);
    if (userSaved) {

      const subject = 'Worker login credentials for Russend';
      const url = process.env.DASHBOARD_LINK;
      const emailData = {
        email: email,
        subject: subject,
        html: `
        <h3>Welcome ${fullName} to Russend as Co-Worker</h3>
        <p><b>Your login credentials:</b></p>
        <hr>
        <table>
          <tr>
            <th align="left">Email:</th>
            <td>${email}</td>
          </tr>
          <tr>
            <th align="left">Password:</th>
            <td>${password}</td>
          </tr>
        </table>
        <p>To login, <a href=${url}>Click here</a></p>`
      }
      await emailWithNodemailer(emailData);
      return res.status(200).json(response({ status: 'OK', statusCode: '201', type: 'user', message: req.t('worker-added'), data: userSaved }));
    }
    return res.status(400).json(response({ status: 'Error', statusCode: '400', type: 'user', message: req.t('worker-not-added') }));
  }
  catch (error) {
    console.error(error);
    logger.error(error, req.originalUrl)
    return res.status(500).json(response({ statusCode: 200, message: req.t('server-error'), status: "Error" }));
  }
}

const getUsers = async (req, res) => {
  try {
    if (req.body.userRole !== 'admin') {
      return res.status(401).json(response({ statusCode: 401, message: req.t('unauthorised'), status: "Error" }));
    }
    
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const filter = {
      role: 'user'
    };
    const search = req.query.search;
    const searchRegExp = new RegExp('.*' + search + '.*', 'i');
    if(search){
      filter.$or = [
        { fullName: searchRegExp },
        { email: searchRegExp },
        { phoneNumber: searchRegExp },
      ]
    }
    const options = { page, limit };
    const { userList, pagination } = await getAllUsers(filter, options);
    return res.status(200).json(response({ status: 'OK', statusCode: '200', type: 'user', message: req.t('user-list'), data: { userList, pagination } }));
  }
  catch (error) {
    console.error(error);
    logger.error(error, req.originalUrl)
    return res.status(500).json(response({ statusCode: 200, message: req.t('server-error'), status: "Error" }));
  }
}

const getWorkers = async (req, res) => {
  try {
    if (req.body.userRole !== 'admin') {
      return res.status(401).json(response({ statusCode: 401, message: req.t('unauthorised'), status: "Error" }));
    }
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const filter = {
      role: 'worker'
    };
    const search = req.query.search;
    const searchRegExp = new RegExp('.*' + search + '.*', 'i');
    if(search){
      filter.$or = [
        { fullName: searchRegExp },
        { email: searchRegExp },
        { phoneNumber: searchRegExp },
      ]
    }
    const options = { page, limit };
    const { userList, pagination } = await getAllUsers(filter, options);
    return res.status(200).json(response({ status: 'OK', statusCode: '200', type: 'user', message: req.t('worker-list'), data: { userList, pagination } }));
  }
  catch (error) {
    console.error(error);
    logger.error(error, req.originalUrl)
    return res.status(500).json(response({ statusCode: 200, message: req.t('server-error'), status: "Error" }));
  }
}

const userDetails = async (req, res) => {
  try {
    const id = req.params.id;
    const userDetails = await getUserById(id);
    return res.status(200).json(response({ statusCode: 200, message: req.t('user-details'), data: userDetails, status: "OK" }));
  }
  catch (error) {
    console.error(error);
    logger.error(error, req.originalUrl)
    return res.status(500).json(response({ statusCode: 200, message: req.t('server-error'), status: "Error" }));
  }
}

const addPasscode = async (req, res) => {
  try {
    var token
    if (req.headers['pass-code'] && req.headers['pass-code'].startsWith('Pass-code ')) {
      token = req.headers['pass-code'].split(' ')[1];
    }
    const tokenData = await verifyToken(token, 'passcode-verification');
    if (!tokenData) {
      return res.status(404).json(response({ status: 'Error', statusCode: '404', type: 'user', message: req.t('invalid-token') }));
    }
    const clientId = req.body.clientId;
    const passcode = req.body.passcode;
    const userData = await getUserById(clientId);
    if (!userData) {
      return res.status(404).json(response({ status: 'Error', statusCode: '404', type: 'user', message: req.t('user-not-exists') }));
    }
    if (userData.role !== 'user') {
      return res.status(400).json(response({ status: 'Error', statusCode: '400', type: 'user', message: req.t('unauthorised') }));
    }
    userData.passcode = passcode;
    await userData.save();
    return res.status(200).json(response({ status: 'OK', statusCode: '200', type: 'user', message: req.t('passcode-added'), data: userData }));
  }
  catch (error) {
    console.error(error);
    logger.error(error, req.originalUrl)
    return res.status(500).json(response({ statusCode: 200, message: req.t('server-error'), status: "Error" }));
  }

}

const verifyPasscode = async (req, res) => {
  try {
    var token
    if (req.headers['pass-code'] && req.headers['pass-code'].startsWith('Pass-code ')) {
      token = req.headers['pass-code'].split(' ')[1];
    }
    const tokenData = await verifyToken(token, 'passcode-verification');
    if (!tokenData) {
      return res.status(404).json(response({ status: 'Error', statusCode: '404', type: 'user', message: req.t('invalid-token') }));
    }
    const { passcode } = req.body;
    console.log(tokenData.userId.email, passcode);
    const user = await loginWithPasscode(tokenData.userId.email, passcode);
    const accessToken = jwt.sign({ _id: tokenData.userId._id, email: tokenData.userId.email, role: tokenData.userId.role }, process.env.JWT_ACCESS_TOKEN, { expiresIn: '30d' });
    const refreshToken = jwt.sign({ _id: user._id, email: user.email, role: user.role }, process.env.JWT_REFRESH_TOKEN, { expiresIn: '5y' });
    await deleteToken(tokenData._id);
    return res.status(200).json(response({ status: 'OK', statusCode: '200', type: 'user', message: req.t('passcode-verfied'), accessToken: accessToken, refreshToken: refreshToken }));
  }
  catch (error) {
    console.error(error);
    logger.error(error, req.originalUrl)
    return res.status(500).json(response({ statusCode: 200, message: req.t(error.message), status: "OK" }));
  }
}

const blockUser = async (req, res) => {
  try {
    if (req.body.userRole !== 'admin') {
      return res.status(401).json(response({ statusCode: 401, message: req.t('unauthorised'), status: "Error" }));
    }
    const existingUser = await getUserById(req.body.userId);
    if (!existingUser) {
      return res.status(404).json(response({ status: 'Error', statusCode: '404', type: 'user', message: req.t('user-not-exists') }));
    }
    if (existingUser.isBlocked) {
      return res.status(400).json(response({ status: 'Error', statusCode: '400', type: 'user', message: req.t('user-already-blocked') }));
    }
    existingUser.isBlocked = true;
    const updatedUser = await updateUser(req.body.userId, existingUser);
    if (updatedUser) {
      return res.status(200).json(response({ status: 'OK', statusCode: '200', type: 'user', message: req.t('user-blocked'), data: existingUser }));
    }
    else {
      return res.status(400).json(response({ status: 'Error', statusCode: '400', type: 'user', message: req.t('user-not-blocked') }));
    }
  }
  catch (error) {
    console.error(error);
    logger.error(error, req.originalUrl)
    return res.status(500).json(response({ statusCode: 500, message: req.t('server-error'), status: "Error" }));
  }
}

const unBlockUser = async (req, res) => {
  try {
    if (req.body.userRole !== 'admin') {
      return res.status(401).json(response({ statusCode: 401, message: req.t('unauthorised'), status: "Error" }));
    }
    const existingUser = await getUserById(req.body.userId);
    if (!existingUser) {
      return res.status(404).json(response({ status: 'Error', statusCode: '404', type: 'user', message: req.t('user-not-exists') }));
    }
    if (!existingUser.isBlocked) {
      return res.status(400).json(response({ status: 'Error', statusCode: '400', type: 'user', message: req.t('user-already-unblocked') }));
    }
    existingUser.isBlocked = true;
    const updatedUser = await updateUser(req.body.userId, existingUser);
    if (updatedUser) {
      return res.status(200).json(response({ status: 'OK', statusCode: '200', type: 'user', message: req.t('user-unblocked'), data: existingUser }));
    }
    else {
      return res.status(400).json(response({ status: 'Error', statusCode: '400', type: 'user', message: req.t('user-not-unblocked') }));
    }
  }
  catch (error) {
    console.error(error);
    logger.error(error, req.originalUrl)
    return res.status(500).json(response({ statusCode: 500, message: req.t('server-error'), status: "Error" }));
  }
}

const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const isValidPassword = validatePassword(newPassword);
    if (!isValidPassword) {
      return res.status(400).json(response({ status: 'Error', statusCode: '400', type: 'user', message: req.t('password-format-error') }));
    }
    const verifyUser = await login(req.body.userEmail, oldPassword);
    if (!verifyUser) {
      return res.status(400).json(response({ status: 'Error', statusCode: '400', type: 'user', message: req.t('user-not-exists') }));
    }
    verifyUser.password = newPassword;
    await verifyUser.save();
    return res.status(200).json(response({ status: 'OK', statusCode: '200', type: 'user', message: req.t('password-changed'), data: verifyUser }));
  }
  catch (error) {
    console.error(error);
    logger.error(error, req.originalUrl)
    return res.status(500).json(response({ statusCode: 500, message: req.t('server-error'), status: "Error" }));
  }
}

const signInWithPasscode = async (req, res) => {
  try{
    const { email, passcode } = req.body;
    if (!email || !passcode) {
      return res.status(400).json(response({ statusCode: 200, message: req.t('login-credentials-required'), status: "OK" }));
    }

    const user = await loginWithPasscode(email, passcode);
    if(user.role !== 'user'){
      return res.status(401).json(response({ statusCode: 401, message: req.t('unauthorised'), status: "Error" }));
    }
    const accessToken = jwt.sign({ _id: user._id, email: user.email, role: user.role }, process.env.JWT_ACCESS_TOKEN, { expiresIn: '30d' });
    return res.status(200).json(response({ status: 'OK', statusCode: '200', type: 'user', message: req.t('login-success'), data: user, token: accessToken }));
  }
  catch (error) {
    console.error(error);
    logger.error(error, req.originalUrl)
    return res.status(500).json(response({ statusCode: 500, message: req.t('server-error'), status: "Error" }));
  }
}

const updateProfile = async (req, res) => {
  try{
    const { fullName, phoneNumber } = req.body;
    const user = await getUserById(req.body.userId);
    if(!user){
      return res.status(404).json(response({ status: 'Error', statusCode: '404', type: 'user', message: req.t('user-not-exists') }));
    }
    user.fullName = !fullName?user.fullName:fullName;
    user.phoneNumber = !phoneNumber?user.phoneNumber:phoneNumber;
    if(req.file){
      if(user.image.path!=='public\\uploads\\users\\user.png'){
        unlinkImages(user.image.path);
      }
      user.image.publicFileUrl = `${process.env.IMAGE_UPLOAD_BACKEND_DOMAIN}/uploads/users/${req.file.filename}`;
      user.image.path = req.file.path;
    }
    await user.save();
    return res.status(200).json(response({ status: 'OK', statusCode: '200', type: 'user', message: req.t('user-updated'), data: user }));
  }
  catch(error){
    console.error(error);
    logger.error(error, req.originalUrl)
    return res.status(500).json(response({ statusCode: 500, message: req.t('server-error'), status: "Error" }));
  }
}

module.exports = { signUp, signIn, forgetPassword, verifyForgetPasswordOTP, addWorker, getWorkers, getUsers, userDetails, resetPassword, addPasscode, verifyPasscode, blockUser, unBlockUser, changePassword, signInWithPasscode, signInWithRefreshToken, updateProfile }