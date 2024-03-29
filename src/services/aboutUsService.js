const AboutUs = require('../models/AboutUs');

const addAboutUs = async (aboutUsBody) => {
  try {
    var aboutUs = await findAboutUs();
    if (aboutUs) {
      aboutUs.content = aboutUsBody.content;
    }
    else {
      aboutUs = new AboutUs(aboutUsBody);
    }
    await aboutUs.save();
    return aboutUs;
  } catch (error) {
    throw error;
  }
}

const findAboutUs = async () => {
  try {
    const aboutUs = await AboutUs.findOne();
    return aboutUs;
  } catch (error) {
    throw error;
  }
}

const getAboutUs = async () => {
  try {
    return await AboutUs.findOne().select('content');
  }
  catch (error) {
    throw error;
  }
}

module.exports = {
  addAboutUs,
  getAboutUs
}
