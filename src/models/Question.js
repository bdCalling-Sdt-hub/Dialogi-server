const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: { type: String, required: [true, 'Question is required'] },
  subCategory: { type: String, required: [true, 'Sub-category is required'] },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  isSharable: { type: Boolean, default: false },
}, { timestamps: true }
);

module.exports = mongoose.model('Question', questionSchema);