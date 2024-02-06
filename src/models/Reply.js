const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  reply: { type: String, required: false },
  discussion: { type: mongoose.Schema.Types.ObjectId, ref: 'Discussion' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  likes: { type: Number, default: 0 },
  dislikes: { type: Number, default: 0 },
}, { timestamps: true }
);

module.exports = mongoose.model('Reply', replySchema);