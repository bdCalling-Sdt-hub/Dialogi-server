const User = require('../../models/User');
const response = require('../../helpers/response');
const logger = require('../../helpers/logger');
const unlinkImage = require('../../common/image/unlinkImage');

function validateEmail(email) {
  return /^[a-zA-ZÀ-ÖØ-öø-ÿ0-9._%+-]+@[a-zA-ZÀ-ÖØ-öø-ÿ0-9.-]+\.[a-zA-ZÀ-ÖØ-öø-ÿ]{2,}$/.test(email);
}

function validatePassword(password) {
  const hasNumber = /\d/.test(password);
  const hasLetter = /[a-zA-ZÀ-ÖØ-öø-ÿ]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  return password.length >= 8 && hasNumber && (hasLetter || hasSpecialChar);
}

const validationMiddleware = async (req, res, next) => {
  try {
    const { fullName, password, email } = req.body;
    let errors = [];
    console.log(req.body);

    const user = await User.findOne({ email });
    if (user) {
      if(req.file){
        unlinkImage(req.file.path)
      }
      return res.status(409).json(response({ status: 'Error', statusCode: '409', type: "sign-up", message: req.t('email-exists') }));
    }

    if (!fullName) {
      errors.push({ field: 'fullName', message: req.t('name-required') });
    }

    if (!validateEmail(email)) {
      errors.push({ field: 'email', message: req.t('email-format-error') });
    }

    if (!validatePassword(password)) {
      errors.push({ field: 'password', message: req.t('password-format-error') });
    }
    
    if (Object.keys(errors).length !== 0) {
      logger.error('Sign up validation error', 'sign-up middleware');
      if(req.file){
        unlinkImage(req.file.path)
      }
      return res.status(422).json(response({ status: 'Error', statusCode: '422', type: "sign-up", message: req.t('validation-error'), errors: errors }));
    }
    next(); // Continue to the next middleware or route handler
  }
  catch (error) {
    logger.error(error, req.originalUrl);
    console.error(error);
    if(req.file){
      unlinkImage(req.file.path)
    }
  }
};


module.exports = validationMiddleware;
