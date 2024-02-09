require('dotenv').config();
const response = require("../helpers/response");
const logger = require("../helpers/logger");
const { getNotifications, getNotificationById } = require('../services/notificationService');

const getAllNotifications = async (req, res) => {
  try{
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const options = {
      page, limit
    }
    const role = req.body.userRole;
    var filter = {};
    if(role==='user'){
      filter.receiver = req.body.userId;
      filter.role = role;
    }
    else{
      filter.role = role;
    }
    const { notificationList, pagination } = await getNotifications(filter, options);
    return res.status(200).json(response({ status: 'Success', statusCode: '200', message: req.t('notification-list'), data: { notificationList, pagination } }));
  }
  catch(error){
    console.error(error);
    logger.error(error.message, req.originalUrl);
    return res.status(500).json(response({ status: 'Error', statusCode: '500', type: 'termsOfService', message: req.t('server-error') }));
  }
}

module.exports = { getAllNotifications }