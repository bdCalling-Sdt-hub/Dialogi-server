require('dotenv').config();
const response = require("../helpers/response");
const logger = require("../helpers/logger");
require('dotenv').config();
const { getAllSubscriptions, updateSubscriptionById } = require('../services/subscriptionService');

const allSubscriptions = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const filter = {
      type:{ $ne: 'default'}
    };  
    const options = { page, limit };
    const subscription = await getAllSubscriptions(filter, options);
    return res.status(200).json(response({ status: 'Success', statusCode: '200', type: 'subscription', message: req.t('subscription-list'), data: subscription }));
  } catch (error) {
    console.error(error);
    logger.error(error.message, req.originalUrl);
    return res.status(500).json(response({ status: 'Error', statusCode: '500', type: 'subscription', message: req.t('server-error') }));
  }
}

const updateSubscription = async (req, res) => {
  try {
    const subscription = await updateSubscriptionById(req.params.id, req.body);
    return res.status(200).json(response({ status: 'Success', statusCode: '200', type: 'subscription', message: req.t('subscription-updated'), data: subscription }));
  } catch (error) {
    console.error(error);
    logger.error(error.message, req.originalUrl);
    return res.status(500).json(response({ status: 'Error', statusCode: '500', type: 'subscription', message: req.t('server-error') }));
  }
}

module.exports = { allSubscriptions, updateSubscription }