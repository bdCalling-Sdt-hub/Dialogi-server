const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  message: { type: String, required: false },
  linkId: { type: String, required: false },
  type: { type: String, enum:['payment', 'user', 'community-request', 'friend-request', 'group-request'], required: false },
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);