require('dotenv').config();
const response = require("../helpers/response");
const jwt = require('jsonwebtoken');
require('dotenv').config();
//defining unlinking image function 
const unlinkImage = require('../common/image/unlinkImage')
const logger = require("../helpers/logger");
const { addUser, login, getUserByEmail, getAllUsers, getUserById, loginWithPasscode, deleteUser } = require('../services/userService')
const { sendOTP, checkOTPByEmail, verifyOTP } = require('../services/otpService');
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
    var { fullName, email, phoneNumber, password, country, countryCode, countryISO } = req.body;
    var otp
    if (req.headers['otp'] && req.headers['otp'].startsWith('OTP ')) {
      otp = req.headers['otp'].split(' ')[1];
    }
    if (!otp) {
      const existingOTP = await checkOTPByEmail(email);
      if (existingOTP) {
        console.log('OTP already exists', existingOTP);
        if (req.file) {
          unlinkImage(req.file.path)
        }
        return res.status(200).json(response({ status: 'OK', statusCode: '200', type: 'user', message: req.t('otp-exists'), data: null }));
      }
      const otpData = await sendOTP(fullName, email, 'email', otpPurpose);
      if (otpData) {
        if (req.file) {
          unlinkImage(req.file.path)
        }
        return res.status(200).json(response({ status: 'OK', statusCode: '200', type: 'user', message: req.t('otp-sent'), data: null }));
      }
    }
    else {
      const otpData = await verifyOTP(email, 'email', otpPurpose, otp);
      if (!otpData) {
        if (req.file) {
          unlinkImage(req.file.path)
        }
        return res.status(400).json(response({ status: 'Error', statusCode: '400', type: 'user', message: req.t('invalid-otp') }));
      }
      const userData = {
        fullName: fullName,
        email: email,
        phoneNumber: phoneNumber,
        password: password,
        countryCode: countryCode,
        countryISO: countryISO,
        role: "user",
      }
      if (country) {
        userData.country = country;
      }
      if (req.file) {
        userData.image = `/uploads/users/${req.file.filename}`
      }
      const registeredUser = await addUser(userData);
      const notifMessage = "New user registered named " + fullName;
      const notification = {
        message: notifMessage,
        linkId: registeredUser._id,
        type: 'user',
        role: 'admin',
      }
      const sendNotification = await addNotification(notification);
      io.emit('dialogi-admin-notification', { status: 1008, message: sendNotification.message })

      return res.status(201).json(response({ status: 'OK', statusCode: '201', type: 'user', message: req.t('user-verified'), data: registeredUser }));
    }
  } catch (error) {
    console.error(error);
    console.log(error)
    logger.error(error, req.originalUrl)
    if (req.file) {
      unlinkImage(req.file.path)
    }
    return res.status(500).json(response({ status: 'Error', statusCode: '500', type: 'user', message: req.t('server-error') }));
  }
};

//Sign in
const signIn = async (req, res) => {
  try {
    //Get email password from req.body
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json(response({ statusCode: '200', message: req.t('login-credentials-required'), status: "OK" }));
    }

    const user = await login(email, password);
    if (user && !user?.isBlocked) {
      const token = jwt.sign({ _id: user._id, email: user.email, role: user.role, subscription: user.subscription }, process.env.JWT_ACCESS_TOKEN, { expiresIn: '1d' });
      const refreshToken = jwt.sign({ _id: user._id, email: user.email, role: user.role, subscription: user.subscription }, process.env.JWT_REFRESH_TOKEN, { expiresIn: '5y' });
      return res.status(200).json(response({ statusCode: '200', message: req.t('login-success'), status: "OK", type: "user", data: user, accessToken: token, refreshToken: refreshToken }));
    }
    if (user && user?.isBlocked) {
      return res.status(401).json(response({ statusCode: '200', message: req.t('blocked-user'), status: "OK" }));
    }
    return res.status(401).json(response({ statusCode: '200', message: req.t('login-failed'), status: "OK" }));

  } catch (error) {
    console.error(error);
    logger.error(error, req.originalUrl)
    return res.status(500).json(response({ statusCode: '200', message: req.t(error), status: "Error" }));
  }
};

const signInWithRefreshToken = async (req, res) => {
  try {
    const user = await getUserById(req.body.userId);
    if (!user || (user && user.isBlocked)) {
      return res.status(404).json(response({ status: 'Error', statusCode: '404', type: 'user', message: req.t('user-not-exists') }));
    }
    const accessToken = jwt.sign({ _id: user._id, email: user.email, role: user.role, subscription: user.subscription }, process.env.JWT_ACCESS_TOKEN, { expiresIn: '1d' });
    return res.status(200).json(response({ status: 'OK', statusCode: '200', type: 'user', message: req.t('login-success'), data: user, accessToken: accessToken }));
  } catch (error) {
    console.error(error);
    logger.error(error, req.originalUrl)
    return res.status(500).json(response({ statusCode: '200', message: req.t('server-error'), status: "Error" }));
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
    return res.status(500).json(response({ statusCode: '200', message: req.t('server-error'), status: "Error" }));
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
    return res.status(500).json(response({ statusCode: '200', message: req.t('server-error'), status: "Error" }));
  }
}

const resetPassword = async (req, res) => {
  try {
    var forgetPasswordToken
    if (req.headers['forget-password'] && req.headers['forget-password'].startsWith('Forget-password ')) {
      forgetPasswordToken = req.headers['forget-password'].split(' ')[1];
    }
    if (!forgetPasswordToken) {
      return res.status(401).json(response({ status: 'Error', statusCode: '400', type: 'user', message: req.t('unauthorised') }));
    }

    const tokenData = await verifyToken(forgetPasswordToken, 'forget-password');
    if (!tokenData) {
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
    return res.status(500).json(response({ statusCode: '200', message: req.t('server-error'), status: "Error" }));
  }
}

const addWorker = async (req, res) => {
  try {
    const { fullName, email, phoneNumber, country } = req.body;
    if (req.body.userRole !== 'admin') {
      return res.status(401).json(response({ statusCode: '401', message: req.t('unauthorised'), status: "Error" }));
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
    if (country) {
      user.country = country;
    }
    const userSaved = await addUser(user);
    if (userSaved) {

      const subject = 'Worker login credentials for dialogi';
      const url = process.env.DASHBOARD_LINK;
      const emailData = {
        email: email,
        subject: subject,
        html: `
        <h3>Welcome ${fullName} to dialogi as Co-Worker</h3>
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
    return res.status(500).json(response({ statusCode: '200', message: req.t('server-error'), status: "Error" }));
  }
}

const getUsers = async (req, res) => {
  try {
    if (req.body.userRole !== 'admin') {
      return res.status(401).json(response({ statusCode: '401', message: req.t('unauthorised'), status: "Error" }));
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const subscription = req.query.subscription || 'free';
    const filter = {
      role: 'user',
      isBlocked: false
    };
    const search = req.query.search;
    const searchRegExp = new RegExp('.*' + search + '.*', 'i');
    if (search) {
      filter.$or = [
        { fullName: searchRegExp },
        { email: searchRegExp },
        { phoneNumber: searchRegExp },
      ]
    }
    if(subscription){
      filter.subscription = subscription;
    }
    const options = { page, limit };
    const { userList, pagination } = await getAllUsers(filter, options);
    return res.status(200).json(response({ status: 'OK', statusCode: '200', type: 'user', message: req.t('user-list'), data: { userList, pagination } }));
  }
  catch (error) {
    console.error(error);
    logger.error(error, req.originalUrl)
    return res.status(500).json(response({ statusCode: '200', message: req.t('server-error'), status: "Error" }));
  }
}

const getWorkers = async (req, res) => {
  try {
    if (req.body.userRole !== 'admin') {
      return res.status(401).json(response({ statusCode: '401', message: req.t('unauthorised'), status: "Error" }));
    }
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const filter = {
      role: 'worker',
      isBlocked: false
    };
    const search = req.query.search;
    const searchRegExp = new RegExp('.*' + search + '.*', 'i');
    if (search) {
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
    return res.status(500).json(response({ statusCode: '200', message: req.t('server-error'), status: "Error" }));
  }
}

const userDetails = async (req, res) => {
  try {
    const id = req.params.id;
    const userDetails = await getUserById(id);
    return res.status(200).json(response({ statusCode: '200', message: req.t('user-details'), data: userDetails, status: "OK" }));
  }
  catch (error) {
    console.error(error);
    logger.error(error, req.originalUrl)
    return res.status(500).json(response({ statusCode: '500', message: req.t('server-error'), status: "Error" }));
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
    const accessToken = jwt.sign({ _id: tokenData.userId._id, email: tokenData.userId.email, role: tokenData.userId.role }, process.env.JWT_ACCESS_TOKEN, { expiresIn: '1d' });
    const refreshToken = jwt.sign({ _id: userData._id, email: userData.email, role: userData.role }, process.env.JWT_REFRESH_TOKEN, { expiresIn: '5y' });
    return res.status(200).json(response({ status: 'OK', statusCode: '200', type: 'user', message: req.t('passcode-added'), data: userData, accessToken: accessToken, refreshToken: refreshToken }));
  }
  catch (error) {
    console.error(error);
    logger.error(error, req.originalUrl)
    return res.status(500).json(response({ statusCode: '200', message: req.t('server-error'), status: "Error" }));
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
    const user = await loginWithPasscode(tokenData.userId.email, passcode);
    if (!user) {
      return res.status(400).json(response({ status: 'Error', statusCode: '400', type: 'user', message: req.t('invalid-passcode') }));
    }
    const accessToken = jwt.sign({ _id: tokenData.userId._id, email: tokenData.userId.email, role: tokenData.userId.role }, process.env.JWT_ACCESS_TOKEN, { expiresIn: '1d' });
    const refreshToken = jwt.sign({ _id: user._id, email: user.email, role: user.role, subscription: user.subscription }, process.env.JWT_REFRESH_TOKEN, { expiresIn: '5y' });
    await deleteToken(tokenData._id);
    return res.status(200).json(response({ status: 'OK', statusCode: '200', type: 'user', message: req.t('passcode-verfied'), data: user, accessToken: accessToken, refreshToken: refreshToken }));
  }
  catch (error) {
    console.error(error);
    logger.error(error, req.originalUrl)
    return res.status(500).json(response({ statusCode: '200', message: req.t(error.message), status: "OK" }));
  }
}

const blockUser = async (req, res) => {
  try {
    if (req.body.userRole !== 'admin') {
      return res.status(401).json(response({ statusCode: '401', message: req.t('unauthorised'), status: "Error" }));
    }
    const existingUser = await getUserById(req.params.id);
    if (!existingUser) {
      return res.status(404).json(response({ status: 'Error', statusCode: '404', type: 'user', message: req.t('user-not-exists') }));
    }
    if (existingUser.isBlocked) {
      return res.status(400).json(response({ status: 'Error', statusCode: '400', type: 'user', message: req.t('user-already-blocked') }));
    }
    existingUser.isBlocked = true;
    existingUser.save();

    const eventName = 'blocked-user::' + existingUser._id.toString()
    io.emit(eventName, { statusCode: 1000, message: "You have been blocked by the admin" })

    return res.status(200).json(response({ status: 'OK', statusCode: '200', type: 'user', message: req.t('user-blocked'), data: existingUser }));

  }
  catch (error) {
    console.error(error);
    logger.error(error, req.originalUrl)
    return res.status(500).json(response({ statusCode: '500', message: req.t('server-error'), status: "Error" }));
  }
}

const unBlockUser = async (req, res) => {
  try {
    if (req.body.userRole !== 'admin') {
      return res.status(401).json(response({ statusCode: '401', message: req.t('unauthorised'), status: "Error" }));
    }
    const existingUser = await getUserById(req.params.id);
    if (!existingUser) {
      return res.status(404).json(response({ status: 'Error', statusCode: '404', type: 'user', message: req.t('user-not-exists') }));
    }
    if (!existingUser.isBlocked) {
      return res.status(400).json(response({ status: 'Error', statusCode: '400', type: 'user', message: req.t('user-already-unblocked') }));
    }
    existingUser.isBlocked = false;
    existingUser.save();

    return res.status(200).json(response({ status: 'OK', statusCode: '200', type: 'user', message: req.t('user-unblocked'), data: existingUser }));
  }
  catch (error) {
    console.error(error);
    logger.error(error, req.originalUrl)
    return res.status(500).json(response({ statusCode: '500', message: req.t('server-error'), status: "Error" }));
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
      return res.status(400).json(response({ status: 'Error', statusCode: '400', type: 'user', message: req.t('password-invalid') }));
    }
    verifyUser.password = newPassword;
    await verifyUser.save();
    return res.status(200).json(response({ status: 'OK', statusCode: '200', type: 'user', message: req.t('password-changed'), data: verifyUser }));
  }
  catch (error) {
    console.error(error);
    logger.error(error, req.originalUrl)
    return res.status(500).json(response({ statusCode: '500', message: req.t('server-error'), status: "Error" }));
  }
}

const signInWithPasscode = async (req, res) => {
  try {
    const { email, passcode } = req.body;
    if (!email || !passcode) {
      return res.status(400).json(response({ statusCode: '200', message: req.t('login-credentials-required'), status: "OK" }));
    }

    const user = await loginWithPasscode(email, passcode);
    if (!user || (user && user.role !== 'user') || (user && user.isBlocked)) {
      return res.status(401).json(response({ statusCode: '401', message: req.t('unauthorised'), status: "Error" }));
    }
    const accessToken = jwt.sign({ _id: user._id, email: user.email, role: user.role, subscription: user.subscription }, process.env.JWT_ACCESS_TOKEN, { expiresIn: '1d' });
    return res.status(200).json(response({ status: 'OK', statusCode: '200', type: 'user', message: req.t('login-success'), data: user, accessToken: accessToken }));
  }
  catch (error) {
    console.error(error);
    logger.error(error, req.originalUrl)
    return res.status(500).json(response({ statusCode: '500', message: req.t('server-error'), status: "Error" }));
  }
}

const updateProfile = async (req, res) => {
  try {
    const { fullName, dateOfBirth, address } = req.body;
    const user = await getUserById(req.body.userId);
    if (!user) {
      return res.status(404).json(response({ status: 'Error', statusCode: '404', type: 'user', message: req.t('user-not-exists') }));
    }
    user.fullName = !fullName ? user.fullName : fullName;
    user.dateOfBirth = !dateOfBirth ? user.dateOfBirth : new Date(dateOfBirth);
    user.address = !address ? user.address : address;
    if (req.file) {
      const defaultPath = '/uploads/users/user.png';
      console.log('req.file', req.file, user.image.path, defaultPath);
      if (user.image !== defaultPath) {
        unlinkImage(user.image);
      }
      user.image = `/uploads/users/${req.file.filename}`
    }
    const updatedUser = await user.save();
    return res.status(200).json(response({ status: 'OK', statusCode: '200', type: 'user', message: req.t('user-updated'), data: updatedUser }));
  }
  catch (error) {
    console.error(error);
    logger.error(error, req.originalUrl)
    return res.status(500).json(response({ statusCode: '500', message: req.t('server-error'), status: "Error" }));
  }
}

const getBlockedUsers = async (req, res) => {
  try {
    if (req.body.userRole !== 'admin') {
      return res.status(401).json(response({ statusCode: '401', message: req.t('unauthorised'), status: "Error" }));
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const filter = {
      isBlocked: true
    };
    const search = req.query.search;
    const searchRegExp = new RegExp('.*' + search + '.*', 'i');
    if (search) {
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
    return res.status(500).json(response({ statusCode: '200', message: req.t('server-error'), status: "Error" }));
  }
}

const verifyOldPasscode = async (req, res) => {
  try {
    const { passcode } = req.body;
    const user = await getUserById(req.body.userId);
    if (req.body.userRole !== 'user') {
      return res.status(404).json(response({ status: 'Error', statusCode: '404', type: 'user', message: req.t('unauthorised') }));
    }
    const verifyUser = await loginWithPasscode(req.body.userEmail, passcode);
    var passcodeToken;
    if (verifyUser) {
      passcodeToken = crypto.randomBytes(32).toString('hex');
      const data = {
        token: passcodeToken,
        userId: user._id,
        purpose: 'passcode-verification',
      }
      await addToken(data);
      return res.status(200).json(response({ status: 'OK', statusCode: '200', type: 'user', message: req.t('passcode-verified'), passcodeToken: passcodeToken }));
    }
    return res.status(400).json(response({ status: 'Error', statusCode: '400', type: 'user', message: req.t('invalid-passcode') }));
  }
  catch (error) {
    console.error(error);
    logger.error(error, req.originalUrl)
    return res.status(500).json(response({ statusCode: '500', message: req.t('server-error'), status: "Error" }));
  }
}

const changePasscode = async (req, res) => {
  try {
    var forgetPasswordToken
    if (req.headers['pass-code'] && req.headers['pass-code'].startsWith('Pass-code ')) {
      forgetPasswordToken = req.headers['pass-code'].split(' ')[1];
    }
    if (!forgetPasswordToken) {
      return res.status(401).json(response({ status: 'Error', statusCode: '400', type: 'user', message: req.t('unauthorised') }));
    }

    const tokenData = await verifyToken(forgetPasswordToken, 'passcode-verification');
    const { newPasscode } = req.body;
    if (!tokenData) {
      return res.status(400).json(response({ status: 'Error', statusCode: '400', type: 'user', message: req.t('unauthorised') }));
    }
    const user = await getUserById(req.body.userId);
    user.passcode = newPasscode;
    await user.save();
    deleteToken(tokenData._id);
    return res.status(200).json(response({ status: 'OK', statusCode: '200', type: 'user', message: req.t('passcode-changed'), data: user }));
  }
  catch (error) {
    console.error(error);
    logger.error(error, req.originalUrl)
    return res.status(500).json(response({ statusCode: '500', message: req.t('server-error'), status: "Error" }));
  }
}

const deleteUserByAdmin = async (req, res) => {
  try {
    const id = req.params.id;
    if (req.body.userRole !== 'admin') {
      return res.status(401).json(response({ statusCode: '401', message: req.t('unauthorised'), status: "Error" }));
    }
    const user = await deleteUser(id);
    if (!user) {
      return res.status(404).json(response({ statusCode: '404', message: req.t('user-not-exists'), status: "Error" }));
    }
    await Transaction.deleteMany({ sender: id });
    await Notification.deleteMany({ receiver: id });
    return res.status(200).json(response({ statusCode: '200', message: req.t('user-deleted'), status: "OK" }));
  }
  catch (error) {
    console.error(error);
    logger.error(error, req.originalUrl)
    return res.status(500).json(response({ statusCode: '500', message: req.t('server-error'), status: "Error" }));
  }
}

module.exports = { signUp, signIn, forgetPassword, verifyForgetPasswordOTP, addWorker, getWorkers, getUsers, userDetails, resetPassword, addPasscode, verifyPasscode, blockUser, unBlockUser, changePassword, signInWithPasscode, signInWithRefreshToken, updateProfile, getBlockedUsers, changePasscode, verifyOldPasscode, deleteUserByAdmin }