require('dotenv').config();
const response = require("../helpers/response");
const logger = require("../helpers/logger");
const { addAboutUs, getAboutUs } = require('../services/aboutUsService');

const upgradeAboutUs = async (req, res) => {
  try{
    if(req.body.userRole!=='admin'){
      res.status(400).json(response({ status: 'Error', statusCode: '400', type: 'aboutUs', message: req.t('unauthorised') }));
    }
    const aboutUs = await addAboutUs(req.body);
    return res.status(201).json(response({ status: 'Success', statusCode: '201', type: 'aboutUs', message: req.t('aboutUs-added'), data: aboutUs }));
  }
  catch(error){
    console.error(error);
    logger.error(error.message, req.originalUrl);
    return res.status(500).json(response({ status: 'Error', statusCode: '500', type: 'aboutUs', message: req.t('server-error') }));
  }
}

const getAllAboutUs = async (req, res) => {
  try{
    const aboutUss = await getAboutUs();
    return res.status(200).json(response({ status: 'Success', statusCode: '200', message: req.t('aboutUss'), data: aboutUss }));
  }
  catch(error){
    console.error(error);
    logger.error(error.message, req.originalUrl);
    return res.status(500).json(response({ status: 'Error', statusCode: '500', type: 'aboutUs', message: req.t('server-error') }));
  }
}

module.exports = { upgradeAboutUs, getAllAboutUs }