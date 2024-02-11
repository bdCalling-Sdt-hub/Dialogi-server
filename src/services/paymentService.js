const Payment = require('../models/Payment');

const addPayment = async (paymentBody) => {
  try {
    var payment = new Payment(paymentBody);
    await payment.save();
    return payment.populate({ path: 'subscription', select: 'type' });
  } catch (error) {
    throw error;
  }
}

module.exports = {
  addPayment
}
