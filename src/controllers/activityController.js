const logger = require("../helpers/logger");
const response = require("../helpers/response");
const Activity = require("../models/Activity");
const User = require("../models/User");

//All activitys
const allActivity = async (req, res) => {
  try {

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    if (req.body.userRole !== 'admin') {
      return res.status(401).json(
        response({
          status: 'Error',
          statusCode: '401',
          message: req.t('unauthorised'),
        })
      );
    }

    const activitys = await Activity.find()
      .limit(limit)
      .skip((page - 1) * limit)
      .sort({createdAt:-1})
    count = await Activity.countDocuments();
    return res.status(200).json(
      response({
        status: 'OK',
        statusCode: '200',
        type: 'activity',
        message: req.t('activity'),
        data: {
          activitys,
          pagination: {
            totalDocuments: count,
            totalPage: Math.ceil(count / limit),
            currentPage: page,
            previousPage: page > 1 ? page - 1 : null,
            nextPage: page < Math.ceil(count / limit) ? page + 1 : null,
          },
        },
      })
    );
  } catch (error) {
    logger.error(error, req.originalUrl);
    console.log(error);
    return res.status(500).json(
      response({
        status: 'Error',
        statusCode: '500',
        message: req.t('server-error'),
      })
    );
  }
};

const deleteActivity = async (req, res) => {
  try {
    const id = req.params.id
    if (req.body.userRole !== 'admin') {
      return res.status(401).json(
        response({
          status: 'Error',
          statusCode: '401',
          message: req.t('unauthorised'),
        })
      );
    }
    const deleteActivity = await Activity.findOneAndDelete(id);
    return res.status(201).json(response({ status: 'Deleted', statusCode: '201', type: 'activity', message: req.t('activity'), data: deleteActivity }));
  }
  catch (error) {
    logger.error(error, req.originalUrl)
    console.error(error);
    return res.status(500).json(response({ status: 'Error', statusCode: '500', type: 'activity',message: req.t('server-error') }));
  }
}

module.exports = { allActivity, deleteActivity };