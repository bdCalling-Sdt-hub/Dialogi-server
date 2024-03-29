const Payment = require('../models/Payment');

const addPayment = async (paymentBody) => {
  try {
    var payment = new Payment(paymentBody);
    await payment.save();
    return payment;
  } catch (error) {
    throw error;
  }
}

const deletePaymentInfoByUserId = async (userId) => {
  return await Payment.deleteMany({ user: userId});
}

module.exports = {
  addPayment,
  deletePaymentInfoByUserId
}
