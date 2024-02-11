const PrivacyPolicy = require('../models/PrivacyPolicy');

const addPrivacyPolicy = async (privacyPolicyBody) => {
  try {
    var privacyPolicy = await findPrivacyPolicy();
    if (privacyPolicy) {
      privacyPolicy.content = privacyPolicyBody.content;
    }
    else {
      privacyPolicy = new PrivacyPolicy(privacyPolicyBody);
    }
    await privacyPolicy.save();
    return privacyPolicy;
  } catch (error) {
    throw error;
  }
}

const findPrivacyPolicy = async () => {
  try {
    const privacyPolicy = await PrivacyPolicy.findOne();
    return privacyPolicy;
  } catch (error) {
    throw error;
  }
}

const getPrivacyPolicys = async () => {
  try {
    return await PrivacyPolicy.findOne().select('content');
  }
  catch (error) {
    throw error;
  }
}

module.exports = {
  addPrivacyPolicy,
  getPrivacyPolicys
}
