require('dotenv').config();
const response = require("../helpers/response");
const jwt = require('jsonwebtoken');
require('dotenv').config();
//defining unlinking image function 
const unlinkImage = require('../common/image/unlinkImage')
const logger = require("../helpers/logger");
const { addUser, login, getUserByEmail, getAllUsers, getUserById, deleteAccount } = require('../services/userService')
const { sendOTP, checkOTPByEmail, verifyOTP } = require('../services/otpService');
const { addNotification } = require('../services/notificationService');
const { addToken, verifyToken, deleteToken } = require('../services/tokenService');
const emailWithNodemailer = require('../helpers/email');
const crypto = require('crypto');
const { getFriendByParticipants, deleteFriendByUserId } = require('../services/frinedService');
const { deleteChatByUserId } = require('../services/chatService');
const { deleteDiscussionByUserId } = require('../services/discussionService');
const { deleteDislikeByUserId } = require('../services/dislikeService')
const { deleteLikeByUserId } = require('../services/likeService');
const { deleteMessageByUserId } = require('../services/messageService');
const { deletePaymentInfoByUserId } = require('../services/paymentService');
const User = require('../models/User');
const Category = require('../models/Category');
const Payment = require('../models/Payment');
const NodeCache = require('node-cache');
const Activity = require('../models/Activity');
const cache = new NodeCache();

const generateWeekList = (last7DaysStart) => {
  const weekList = [];
  for (let i = 1; i <= 7; i++) {
    const currentDate = new Date(last7DaysStart);
    currentDate.setDate(currentDate.getDate() + i);
    const dayOfWeek = currentDate.toLocaleDateString('en-US', { weekday: 'short' });
    weekList.push({ day: dayOfWeek, income: 0 }); // Initialize income as 0
  }
  return weekList;
};


const getNextDayStart = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0); // Set time to 00:00:00:000
  return Math.floor((tomorrow.getTime() - Date.now()) / 1000); // Convert to seconds
};

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

      const accessToken = jwt.sign({userFullName: registeredUser.fullName, _id: registeredUser._id, email: registeredUser.email, role: registeredUser.role, subscription: registeredUser.subscription }, process.env.JWT_ACCESS_TOKEN, { expiresIn: '1y' });
      const refreshToken = jwt.sign({userFullName: registeredUser.fullName, _id: registeredUser._id, email: registeredUser.email, role: registeredUser.role, subscription: registeredUser.subscription }, process.env.JWT_REFRESH_TOKEN, { expiresIn: '5y' });

      return res.status(201).json(response({ status: 'OK', statusCode: '201', type: 'user', message: req.t('user-verified'), data: registeredUser, accessToken: accessToken, refreshToken: refreshToken }));
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
    console.log(email, password)

    const user = await login(email, password);
    if (user && !user?.isBlocked) {
      let activityId = null
    if (user.role === 'admin') {
      function extractDeviceModel(userAgent) {
        const regex = /\(([^)]+)\)/;
        const matches = userAgent.match(regex);

        if (matches && matches.length >= 2) {
          return matches[1];
        } else {
          return 'Unknown';
        }
      }

      const userA = req.headers['user-agent'];

      const deviceModel = extractDeviceModel(userA);


      function getBrowserInfo(userAgent) {
        const ua = userAgent.toLowerCase();

        if (ua.includes('firefox')) {
          return 'Firefox';
        } else if (ua.includes('edg')) {
          return 'Edge';
        } else if (ua.includes('safari') && !ua.includes('chrome')) {
          return 'Safari';
        } else if (ua.includes('opr') || ua.includes('opera')) {
          return 'Opera';
        } else if (ua.includes('chrome')) {
          return 'Chrome';
        } else {
          return 'Unknown';
        }
      }
      // const deviceNameOrModel = req.headers['user-agent'];
      const userAgent = req.get('user-agent');
      const browser = getBrowserInfo(userAgent);
      const activity = await Activity.create({
        operatingSystem: deviceModel,
        browser,
        userId: user._id
      });
      console.log(activity)
      activityId = activity._id
    }


      const token = jwt.sign({userFullName: user.fullName, _id: user._id, email: user.email, role: user.role, subscription: user.subscription, activityId: activityId }, process.env.JWT_ACCESS_TOKEN, { expiresIn: '1y' });
      const refreshToken = jwt.sign({userFullName: user.fullName, _id: user._id, email: user.email, role: user.role, subscription: user.subscription }, process.env.JWT_REFRESH_TOKEN, { expiresIn: '5y' });
      return res.status(200).json(response({ statusCode: '200', message: req.t('login-success'), status: "OK", type: "user", data: user, accessToken: token, refreshToken: refreshToken }));
    }
    return res.status(404).json(response({ statusCode: '400', message: req.t('login-failed'), status: "OK" }));
  } catch (error) {
    console.error(error);
    logger.error(error, req.originalUrl)
    return res.status(500).json(response({ statusCode: '500', message: req.t('server-error'), status: "Error" }));
  }
};

const signInWithRefreshToken = async (req, res) => {
  try {
    const user = await getUserById(req.body.userId);
    if (!user || (user && user.isBlocked)) {
      return res.status(404).json(response({ status: 'Error', statusCode: '404', type: 'user', message: req.t('user-not-exists') }));
    }
    const accessToken = jwt.sign({userFullName: user.fullName, _id: user._id, email: user.email, role: user.role, subscription: user.subscription }, process.env.JWT_ACCESS_TOKEN, { expiresIn: '1y' });
    return res.status(200).json(response({ status: 'OK', statusCode: '200', type: 'user', message: req.t('login-success'), data: user, accessToken: accessToken }));
  } catch (error) {
    console.error(error);
    logger.error(error, req.originalUrl)
    return res.status(500).json(response({ statusCode: '500', message: req.t('server-error'), status: "Error" }));
  }
};

const signInWithProvider = async (req, res) => {
  try {
    var user = await getUserByEmail(req.body.email);
    if (!user) {
      user = {
        fullName: req.body.fullName,
        email: req.body.email,
        role: 'user',
        subscription: 'default',
        loginInWithProvider: true
      }
      user = await addUser(user);
    }
    const accessToken = jwt.sign({userFullName: user.fullName, _id: user._id, email: user.email, role: user.role, subscription: user.subscription }, process.env.JWT_ACCESS_TOKEN, { expiresIn: '1y' });

    return res.status(200).json(response({ status: 'OK', statusCode: '200', type: 'user', message: req.t('login-success'), data: user, accessToken: accessToken }));
  } catch (error) {
    console.error(error);
    logger.error(error, req.originalUrl)
    return res.status(500).json(response({ statusCode: '500', message: req.t('server-error'), status: "Error" }));
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
    return res.status(500).json(response({ statusCode: '500', message: req.t('server-error'), status: "Error" }));
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
    return res.status(500).json(response({ statusCode: '500', message: req.t('server-error'), status: "Error" }));
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
    return res.status(500).json(response({ statusCode: '500', message: req.t('server-error'), status: "Error" }));
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
    return res.status(500).json(response({ statusCode: '500', message: req.t('server-error'), status: "Error" }));
  }
}

const getUsers = async (req, res) => {
  try {
    if (req.body.userRole !== 'admin') {
      return res.status(401).json(response({ statusCode: '401', message: req.t('unauthorised'), status: "Error" }));
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const subscription = req.query.subscription;
    var filter = {
      role: 'user'
    };
    const search = req.query.search;
    const searchRegExp = new RegExp('.*' + search + '.*', 'i');
    if (search) {
      filter = {
        ...filter,
        fullName: searchRegExp,
        email: searchRegExp,
        phoneNumber: searchRegExp
      }
    }
    if (subscription) {
      filter = {
        ...filter,
        subscription: subscription
      }
    }
    const options = { page, limit };
    const { userList, pagination } = await getAllUsers(filter, options);
    return res.status(200).json(response({ status: 'OK', statusCode: '200', type: 'user', message: req.t('user-list'), data: { userList, pagination } }));
  }
  catch (error) {
    console.error(error);
    logger.error(error, req.originalUrl)
    return res.status(500).json(response({ statusCode: '500', message: req.t('server-error'), status: "Error" }));
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
    return res.status(500).json(response({ statusCode: '500', message: req.t('server-error'), status: "Error" }));
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

const getProfileDetails = async (req, res) => {
  try {
    const id = req.params.id;
    const userDetails = await getUserById(id);
    const profileDetails = [userDetails._id, req.body.userId]
    const frinedStatus = await getFriendByParticipants(profileDetails);
    var friendRequestStatus = "rejected";
    if (frinedStatus) {
      friendRequestStatus = frinedStatus.status;
    }
    return res.status(200).json(response({ statusCode: '2000', message: req.t('user-details'), data: { userDetails, friendRequestStatus }, status: "OK" }));
  }
  catch (error) {
    console.error(error);
    logger.error(error, req.originalUrl)
    return res.status(500).json(response({ statusCode: '500', message: req.t('server-error'), status: "Error" }));
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

const updateProfile = async (req, res) => {
  console.log(req.body)
  console.log(req.file)
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
    if(req.file){
      unlinkImage(req.file.path)
    }
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

const deleteUserAccount = async (req, res) => {
  try {
    const { password } = req.body;
    const user = await login(req.body.userEmail, password);
    if (!user) {
      return res.status(400).json(response({ statusCode: '400', message: req.t('password-invalid'), status: "Error" }));
    }
    await deleteAccount(user._id);
    await deleteChatByUserId(user._id);
    await deleteDiscussionByUserId(user._id);
    await deleteDislikeByUserId(user._id);
    await deleteFriendByUserId(user._id);
    await deleteLikeByUserId(user._id);
    await deleteMessageByUserId(user._id);
    await deletePaymentInfoByUserId(user._id);

    return res.status(200).json(response({ statusCode: '200', message: req.t('user-deleted'), status: "OK" }));
  }
  catch (error) {
    console.error(error);
    logger.error(error, req.originalUrl)
    return res.status(500).json(response({ statusCode: '500', message: req.t('server-error'), status: "Error" }));
  }
}

const dashboardCounts = async (req, res) => {
  try {
    if (req.body.userRole !== 'admin') {
      return res.status(401).json(response({ statusCode: '401', message: req.t('unauthorised22'), status: "Error" }));
    }
    const last7DaysStart = new Date(new Date().setDate(new Date().getDate() - 7));
    const totalUsers = await User.countDocuments({ role: 'user' });
    const last7DaysUsers = await User.countDocuments({ role: 'user', createdAt: { $gte: last7DaysStart, $lte: new Date() } });
    const totalCategories = await Category.countDocuments();
    const totalDefaulters = await User.countDocuments({ role: 'user', subscription: 'default', createdAt: { $gte: last7DaysStart, $lte: new Date() } });
    const totalPremiums = await User.countDocuments({ role: 'user', subscription: 'premium', createdAt: { $gte: last7DaysStart, $lte: new Date() } });
    const totalPremiumsPlus = await User.countDocuments({ role: 'user', subscription: 'premium-plus', createdAt: { $gte: last7DaysStart, $lte: new Date() } });

    const paymentInfo = await Payment.find({ createdAt: { $gte: last7DaysStart, $lte: new Date() } });

    let weekList = cache.get('weekList');

    // If not cached, generate and cache it
    if (weekList === undefined) {
      weekList = generateWeekList(last7DaysStart);
      const expirationTime = getNextDayStart(); // Get expiration time in seconds
      cache.set('weekList', weekList, expirationTime);
    }

    const result = await Payment.aggregate([
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$paymentData.amount' } // Sum up the amount field from paymentData
        }
      }
    ]);

    // Extract the total amount from the result
    const totalAmount = result.length > 0 ? result[0].totalAmount : 0;


    paymentInfo.forEach(payment => {
      const paymentDay = payment.createdAt.toLocaleDateString('en-US', { weekday: 'short' });
      const dayIndex = weekList.findIndex(day => day.day === paymentDay);
      if (dayIndex !== -1) {
        weekList[dayIndex].income += payment.paymentData.amount;
      }
    });
    return res.status(200).json(response({
      statusCode: '200', message: req.t('dashboard-counts'), status: "OK", data: {
        totalUsers,
        totalCategories,
        totalDefaulters,
        totalPremiums,
        totalPremiumsPlus,
        defatultPercentage: (totalDefaulters / last7DaysUsers) * 100,
        premiumPercentage: (totalPremiums / last7DaysUsers) * 100,
        plusPercentage: (totalPremiumsPlus / last7DaysUsers) * 100,
        today: new Date(),
        last7DaysStart,
        weekList,
        totalAmount
      }
    }));
  }
  catch (error) {
    console.error(error);
    logger.error(error, req.originalUrl)
    return res.status(500).json(response({ statusCode: '500', message: req.t('server-error'), status: "Error" }));
  }
}

const getPremiumPlusUsers = async (req, res) => {
  try {
    if (req.body.userRole !== 'user') {
      return res.status(401).json(response({ statusCode: '401', message: req.t('unauthorised'), status: "Error" }));
    }
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const filter = {
      role: 'user',
      subscription: 'premium-plus',
      _id: { $ne: req.body.userId }
    };
    const options = { page, limit };
    const { userList, pagination } = await getAllUsers(filter, options);
    return res.status(200).json(response({ status: 'OK', statusCode: '200', type: 'user', message: req.t('user-list'), data: { userList, pagination } }));
  }
  catch (error) {
    console.error(error);
    logger.error(error, req.originalUrl)
    return res.status(500).json(response({ statusCode: '500', message: req.t('server-error'), status: "Error" }));
  }
}

module.exports = { signUp, signIn, forgetPassword, verifyForgetPasswordOTP, addWorker, getWorkers, getUsers, userDetails, resetPassword, blockUser, unBlockUser, changePassword, signInWithRefreshToken, updateProfile, getBlockedUsers, deleteUserByAdmin, getProfileDetails, deleteUserAccount, signInWithProvider, dashboardCounts, getPremiumPlusUsers }