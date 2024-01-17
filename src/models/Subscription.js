const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  firstName: { type: String, required: [true, 'First Name is must be given'], trim: true },
  lastName: { type: String, required: [true, 'Last Name is must be given'], trim: true },
  phoneNumber: { type: String, required: true, trim: true },
  amountToSent: { type: Number, required: true, trim: true },
  ammountToSentCurrency: { type: String, required: true, trim: true },
  amountToReceive: { type: Number, required: true, trim: true },
  amountToReceiveCurrency: { type: String, required: true, trim: true },
  exchangeRate: { type: Number, required: true, trim: true },
  hiddenFees: { type: Number, required: true, trim: true },
  paymentMethod: { type: String, required: true, trim: true },
  sender:{type:mongoose.Schema.Types.ObjectId,ref:'User'},
  status: { type: String, enum: ['success', 'pending', 'cancelled'], default: 'pending' },
}, { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);