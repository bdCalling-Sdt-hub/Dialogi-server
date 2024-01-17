const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: { type: String, required: false },
  subCategory: { type: String, required: false },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  isSharable: { type: Boolean, default: false },
}, { timestamps: true }
);

module.exports = mongoose.model('Question', questionSchema);