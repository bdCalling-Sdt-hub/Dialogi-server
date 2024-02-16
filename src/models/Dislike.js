const mongoose = require('mongoose');

const dislikeSchema = new mongoose.Schema({
  discussion: { type: mongoose.Schema.Types.ObjectId, ref: 'Discussion', required: false },
  reply: { type: mongoose.Schema.Types.ObjectId, ref: 'Reply' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true }
);

module.exports = mongoose.model('Dislike', dislikeSchema);