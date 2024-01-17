const User = require('../../models/User');
const response = require('../../helpers/response');
const logger = require('../../helpers/logger');

const validatePolicy = async (req, res, next) => {
  try {
    const { content } = req.body;
    let errors = [];

    if (!content) {
      errors.push({ field: 'content', message: req.t('content-required') });
    }
    
    if (Object.keys(errors).length !== 0) {
      logger.error('Sign up validation error', req.originalUrl);
      return res.status(422).json(response({ status: 'Error', statusCode: '422', type: "policy", message: req.t('validation-error'), errors: errors }));
    }
    next(); // Continue to the next middleware or route handler
  }
  catch (error) {
    logger.error(error, req.originalUrl);
    console.error(error);
  }
};


module.exports = validatePolicy;
