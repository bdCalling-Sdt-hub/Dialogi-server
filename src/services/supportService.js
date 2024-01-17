const Support = require('../models/Support');

const addSupport = async (supportBody) => {
  try {
    var support = await findSupport(supportBody);
    if (support) {
      support.content = supportBody.content;
    }
    else {
      support = new Support(supportBody);
    }
    await support.save();
    return support;
  } catch (error) {
    throw error;
  }
}

const findSupport = async (supportBody) => {
  try {
    const support = await Support.findOne({content: supportBody.content});
    return support;
  } catch (error) {
    throw error;
  }
}

const getSupports = async () => {
  try {
    return await Support.findOne().select('content');
  }
  catch (error) {
    throw error;
  }
}

module.exports = {
  addSupport,
  getSupports
}
