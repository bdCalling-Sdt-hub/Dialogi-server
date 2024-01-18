const OTP = require('../models/OTP');
const emailWithNodemailer = require('../helpers/email');
require('dotenv').config();

const sendOTP = async (name, sentTo, receiverType, purpose) => {
  try {
    const otp = Math.floor(100000 + Math.random() * 900000);

    const otpExpiryTime = process.env.OTP_EXPIRY_TIME || 3; // Default OTP expiry time is 3 minutes
    const expiredAt = new Date();
    expiredAt.setMinutes(expiredAt.getMinutes() + otpExpiryTime);

    const newOTP = new OTP({
      sentTo,
      receiverType,
      purpose,
      otp,
      expiredAt,
    });
    await newOTP.save();
    const subject = purpose === 'email-verification' ? 'Email verification code' : 'Forgot password code';

    //sending email if receiverType is email
    if (receiverType === 'email') {
      const emailData = {
        email: sentTo,
        subject: subject,
        html: `
          <h1>Hello, ${name}</h1>
          <p>Your One Time Code is <h3>${otp}</h3> to verify your account</p>
          <small>This Code is valid for ${process.env.OTP_EXPIRY_TIME}minutes</small>
        `
      }
      await emailWithNodemailer(emailData);
    }
    return true;
  } catch (error) {
    throw error;
  }
}

const checkOTPByEmail = async (sentTo) => {
  try {
    return await OTP.findOne({ sentTo: sentTo, status: 'pending', expiredAt: { $gt: new Date() } })
  }
  catch (error) {
    throw error;
  }
}

const verifyOTP = async (sentTo, receiverType, purpose, otp) => {
  try {
    const otpData = await OTP.findOne({ sentTo, receiverType, purpose, otp, expiredAt: { $gt: new Date() }, status: { $eq: "pending" }, verifiedAt: { $eq: null } })
    if (!otpData) {
      return null;
    }
    otpData.status = 'expired';
    otpData.verifiedAt = new Date();
    await otpData.save();
    return otpData;
  }
  catch (error) {
    throw error;
  }
}

module.exports = {
  sendOTP,
  checkOTPByEmail,
  verifyOTP
}