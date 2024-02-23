const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
  discussion: { type: mongoose.Schema.Types.ObjectId, ref: 'Discussion', required: false },
  reply: { type: mongoose.Schema.Types.ObjectId, ref: 'Reply', required: false },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { type: String, enum: ['discussion', 'reply'], required: true }

}, { timestamps: true }
);

module.exports = mongoose.model('Like', likeSchema);