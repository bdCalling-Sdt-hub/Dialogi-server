require('dotenv').config();
const response = require("../helpers/response");
const logger = require("../helpers/logger");
const jwt = require('jsonwebtoken');
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { getSubscriptionById } = require('../services/subscriptionService');
const { addPayment } = require('../services/paymentService');
const { getUserById } = require('../services/userService');
const { addMySubscription } = require('../services/mySubscriptionService');

const makePayment = async (req, res) => {
  const { subscriptionId } = req.body;
  try {
    if (req.body.userRole !== 'user') {
      return res.status(400).json(response({ status: 'Error', statusCode: '400', type: 'payment', message: req.t('unauthorised') }));
    }
    if (!subscriptionId) {
      return res.status(400).json(response({ status: 'Error', statusCode: '400', type: 'payment', message: req.t('subscription-id-required') }));
    }
    const subscription = await getSubscriptionById(subscriptionId);
    if (!subscription) {
      return res.status(404).json(response({ status: 'Error', statusCode: '404', type: 'payment', message: req.t('subscription-not-found') }));
    }
    const paymentData = await stripe.paymentIntents.create({
      amount: subscription.price * 100,
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
    });
    console.log('paymentData--->', paymentData);
    return res.status(200).json(response({ status: 'Success', statusCode: '200', type: 'payment', message: req.t('payment-token-created'), data: { client_secret: paymentData.client_secret } }));
  } catch (error) {
    console.error(error);
    logger.error(error.message, req.originalUrl);
    return res.status(500).json(response({ status: 'Error', statusCode: '500', type: 'payment', message: req.t('server-error') }));
  }
}

const successPayment = async (req, res) => {
  try {
    const { paymentData, subscriptionId } = req.body;
    const user = await getUserById(req.user._id);
    if (!user) {
      return res.status(404).json(response({ status: 'Error', statusCode: '404', type: 'payment', message: req.t('user-not-found') }));
    }
    if (!paymentData || !subscriptionId) {
      return res.status(400).json(response({ status: 'Error', statusCode: '400', type: 'payment', message: req.t('payment-data-required') }));
    }
    const subscription = await getSubscriptionById(subscriptionId);
    if (!subscription) {
      return res.status(404).json(response({ status: 'Error', statusCode: '404', type: 'payment', message: req.t('subscription-not-found') }));
    }
    // save payment info
    const paymentInfo = await addPayment({ paymentData, subscription: subscriptionId, user: req.user._id, status: 'success' });
    var myUpdatedSubscription;
    var accessToken;
    if (paymentInfo) {
      // update user subscription
      const user = await getUserById(req.user._id);
      user.subscription = subscription?.type;
      user.subscriptionId = subscription?._id;
      await user.save();

      //add my subscription
      const mySubscription = {
        user: user._id,
        type: subscription?.type,
        isAddAvailable: subscription?.isAddAvailable,

        //category access
        categoryAccessNumber: subscription?.categoryAccessNumber,
        isCategoryAccessUnlimited: subscription.isCategoryAccessUnlimited,

        //question access
        questionAccessNumber: subscription,
        isQuestionAccessUnlimited: subscription.isQuestionAccessUnlimited,

        //chat access
        isChatAvailable: subscription.isChatAvailable,
        isGroupChatAvailable: subscription.isGroupChatAvailable,
        isCommunityDiscussionAvailable: subscription.isCommunityDiscussionAvailable,

        //early access
        isEarlyAccessAvailable: subscription.isEarlyAccessAvailable,

        //profile update access
        updateProfileAccess: subscription.updateProfileAccess,

        //expiry date shiuld be current date month + expiry time
        expiryTime: subscription.expiryTime,
      }

      myUpdatedSubscription = await addMySubscription(mySubscription);

      accessToken = jwt.sign({ _id: user._id, email: user.email, role: user.role, subscription: user.subscription }, process.env.JWT_ACCESS_TOKEN, { expiresIn: '1d' });;
    }
    // update user subscription
    return res.status(200).json(response({ status: 'Success', statusCode: '200', type: 'payment', message: req.t('payment-success'), data: {paymentInfo, myUpdatedSubscription}, accessToken: accessToken }));
  } catch (error) {
    console.error(error);
    logger.error(error.message, req.originalUrl);
    return res.status(500).json(response({ status: 'Error', statusCode: '500', type: 'payment', message: req.t('server-error') }));
  }
}

const cancelPayment = async (req, res) => {
  try {
    const { paymentData, subscriptionId } = req.body;
    if (!paymentData || !subscriptionId) {
      return res.status(400).json(response({ status: 'Error', statusCode: '400', type: 'payment', message: req.t('payment-data-required') }));
    }
    // save payment info
    const paymentInfo = await addPayment({ paymentData, subscription: subscriptionId, user: req.user._id, status: 'cancelled' });
    // update user subscription
    return res.status(200).json(response({ status: 'Success', statusCode: '200', type: 'payment', message: req.t('payment-success'), data: paymentInfo }));
  } catch (error) {
    console.error(error);
    logger.error(error.message, req.originalUrl);
    return res.status(500).json(response({ status: 'Error', statusCode: '500', type: 'payment', message: req.t('server-error') }));
  }
}

module.exports = { makePayment, successPayment, cancelPayment }