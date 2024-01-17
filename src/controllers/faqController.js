require('dotenv').config();
const response = require("../helpers/response");
const logger = require("../helpers/logger");
const { addFaq, getFaqs } = require('../services/faqService');

const upgradeFaq = async (req, res) => {
  try{
    if(req.body.userRole!=='admin'){
      res.status(400).json(response({ status: 'Error', statusCode: '400', type: 'faq', message: req.t('unauthorised') }));
    }
    const faq = await addFaq(req.body);
    return res.status(201).json(response({ status: 'Success', statusCode: '201', type: 'faq', message: req.t('faq-added'), data: faq }));
  }
  catch(error){
    console.error(error);
    logger.error(error.message, req.originalUrl);
    return res.status(500).json(response({ status: 'Error', statusCode: '500', type: 'faq', message: req.t('server-error') }));
  }
}

const getAllFaqs = async (req, res) => {
  try{
    const faqs = await getFaqs();
    return res.status(200).json(response({ status: 'Success', statusCode: '200', message: req.t('faqs'), data: faqs }));
  }
  catch(error){
    console.error(error);
    logger.error(error.message, req.originalUrl);
    return res.status(500).json(response({ status: 'Error', statusCode: '500', type: 'faq', message: req.t('server-error') }));
  }
}

module.exports = { upgradeFaq, getAllFaqs }