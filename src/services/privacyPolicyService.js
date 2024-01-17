const PrivacyPolicy = require('../models/PrivacyPolicy');

const addPrivacyPolicy = async (privacyPolicyBody) => {
  try {
    var privacyPolicy = await findPrivacyPolicy(privacyPolicyBody);
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

const findPrivacyPolicy = async (privacyPolicyBody) => {
  try {
    const privacyPolicy = await PrivacyPolicy.findOne({content: privacyPolicyBody.content});
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
