require('dotenv').config();
const response = require("../helpers/response");
const logger = require("../helpers/logger");
const { upgradeFavourite, getFavouriteList } = require('../services/favouriteService');

const addNewFavourite = async (req, res) => {
  try{
    if(req.body.userRole!=='user'){
      return res.status(400).json(response({ status: 'Error', statusCode: '400', type: 'favourite', message: req.t('unauthorised') }));
    }
    req.body.user = req.body.userId;
    const favourite = await upgradeFavourite(req.body);
    return res.status(201).json(response({ status: 'Success', statusCode: '201', type: 'favourite', message: req.t(favourite.message), data: favourite.data }));
  }
  catch(error){
    console.error(error);
    logger.error(error.message, req.originalUrl);
    return res.status(500).json(response({ status: 'Error', statusCode: '500', type: 'favourite', message: req.t('server-error') }));
  }
}

const allFavourites = async (req, res) => {
  try{
    const { page, limit } = req.query;
    const options = { page, limit };
    const filter = {
      user: req.body.userId
    };
    const favourites = await getFavouriteList(filter, options);
    return res.status(200).json(response({ status: 'Success', statusCode: '200', message: req.t('favourites'), data: favourites }));
  }
  catch(error){
    console.error(error);
    logger.error(error.message, req.originalUrl);
    return res.status(500).json(response({ status: 'Error', statusCode: '500', type: 'favourite', message: req.t('server-error') }));
  }
}
module.exports = { addNewFavourite, allFavourites }