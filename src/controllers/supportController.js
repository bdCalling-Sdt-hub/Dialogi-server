require('dotenv').config();
const response = require("../helpers/response");
const logger = require("../helpers/logger");
const { addSupport, getSupports } = require('../services/supportService');

const upgradeSupport = async (req, res) => {
  try{
    if(req.body.userRole!=='admin'){
      return res.status(400).json(response({ status: 'Error', statusCode: '400', type: 'support', message: req.t('unauthorised') }));
    }
    const support = await addSupport(req.body);
    return res.status(201).json(response({ status: 'Success', statusCode: '201', type: 'support', message: req.t('support-added'), data: support }));
  }
  catch(error){
    console.error(error);
    logger.error(error.message, req.originalUrl);
    return res.status(500).json(response({ status: 'Error', statusCode: '500', type: 'support', message: req.t('server-error') }));
  }
}

const getAllSupports = async (req, res) => {
  try{
    const supports = await getSupports();
    return res.status(200).json(response({ status: 'Success', statusCode: '200', message: req.t('supports'), data: supports }));
  }
  catch(error){
    console.error(error);
    logger.error(error.message, req.originalUrl);
    return res.status(500).json(response({ status: 'Error', statusCode: '500', type: 'support', message: req.t('server-error') }));
  }
}

module.exports = { upgradeSupport, getAllSupports }