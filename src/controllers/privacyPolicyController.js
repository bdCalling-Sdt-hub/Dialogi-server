require('dotenv').config();
const response = require("../helpers/response");
const logger = require("../helpers/logger");
const { addPrivacyPolicy, getPrivacyPolicys } = require('../services/privacyPolicyService');

const upgradePrivacyPolicy = async (req, res) => {
  try{
    if(req.body.userRole!=='admin'){
      res.status(400).json(response({ status: 'Error', statusCode: '400', type: 'privacyPolicy', message: req.t('unauthorised') }));
    }
    const privacyPolicy = await addPrivacyPolicy(req.body);
    return res.status(201).json(response({ status: 'Success', statusCode: '201', type: 'privacyPolicy', message: req.t('privacyPolicy-added'), data: privacyPolicy }));
  }
  catch(error){
    console.error(error);
    logger.error(error.message, req.originalUrl);
    return res.status(500).json(response({ status: 'Error', statusCode: '500', type: 'privacyPolicy', message: req.t('server-error') }));
  }
}

const getAllPrivacyPolicys = async (req, res) => {
  try{
    const privacyPolicys = await getPrivacyPolicys();
    return res.status(200).json(response({ status: 'Success', statusCode: '200', message: req.t('privacyPolicys'), data: privacyPolicys }));
  }
  catch(error){
    console.error(error);
    logger.error(error.message, req.originalUrl);
    return res.status(500).json(response({ status: 'Error', statusCode: '500', type: 'privacyPolicy', message: req.t('server-error') }));
  }
}

module.exports = { upgradePrivacyPolicy, getAllPrivacyPolicys }