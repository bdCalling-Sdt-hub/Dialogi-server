const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: { type: String, required: [true, 'Question is required'] },
  questionGr: { type: String, required: [true, 'Question in German Language is required'] },
  subCategory: { type: String, required: [true, 'Sub-category is required'] },
  subCategoryGr: { type: String, required: [true, 'Sub-category in German is required'] },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  isSharable: { type: Boolean, default: false },
  isEarlyAccessAvailable: { type: Boolean, default: false },
}, { timestamps: true }
);

module.exports = mongoose.model('Question', questionSchema);