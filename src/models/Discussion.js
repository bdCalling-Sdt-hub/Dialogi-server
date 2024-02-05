const mongoose = require('mongoose');

const discussionSchema = new mongoose.Schema({
  discussion: { type: String, required: false },
  question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Discussion' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isSharable: { type: Boolean, default: false },
  likes: { type: Number, default: 0 },
  dislikes: { type: Number, default: 0 },
  order: { type: Number, default: 0 },
}, { timestamps: true }
);

module.exports = mongoose.model('Discussion', discussionSchema);