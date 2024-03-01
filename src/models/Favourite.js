const mongoose = require('mongoose');

const favouriteSchema = new mongoose.Schema({
  question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
}, { timestamps: true }
);

module.exports = mongoose.model('Favourite', favouriteSchema);