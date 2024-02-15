const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: false },
  type: { type: String, enum: ["default", "premium"], required: false },
  isEarlyAccessAvailable: { type: Boolean, required: false },
  image: {
    type: String,
    default: '/uploads/categories/defcat.jpg'
  },
});

module.exports = mongoose.model('Category', categorySchema);