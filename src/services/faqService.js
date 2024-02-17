const Faq = require('../models/Faq');

const addFaq = async (faqBody) => {
  try {
    var faq = await findFaq(faqBody);
    if (faq) {
      faq.question = faqBody.question;
      faq.answer = faqBody.answer;
    }
    else {
      faq = new Faq(faqBody);
    }
    await faq.save();
    return faq;
  } catch (error) {
    throw error;
  }
}

const findFaq = async (faqBody) => {
  try {
    const faq = await Faq.findOne({question: faqBody.question, answer: faqBody.answer});
    return faq;
  } catch (error) {
    throw error;
  }
}

const getFaqs = async () => {
  try {
    return await Faq.find().select('question answer');
  }
  catch (error) {
    throw error;
  }
}

module.exports = {
  addFaq,
  getFaqs
}
