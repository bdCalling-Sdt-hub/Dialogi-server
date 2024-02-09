const mongoose = require('mongoose');

const paymentInfoSchema = new mongoose.Schema({
  paymentData: { type: Object, required: false },
  subscription: { type: mongoose.Schema.Types.ObjectId, ref: 'Subscription' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['success', 'pending', 'cancelled'], default: 'pending' }
}, { timestamps: true }
);

module.exports = mongoose.model('PaymentInfo', paymentInfoSchema);