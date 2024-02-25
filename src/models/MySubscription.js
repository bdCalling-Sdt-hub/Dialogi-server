const mongoose = require('mongoose');

const mySubscriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ["default", "premium", "premium-plus"], required: false },

  //show add
  isAddAvailable: { type: Boolean, default: false },

  //category access
  categoryAccessNumber: { type: Number, default: 0 },
  isCategoryAccessUnlimited: { type: Boolean, default: false },

  //question access
  questionAccessNumber: { type: Number, default: 0 },
  isQuestionAccessUnlimited: { type: Boolean, default: false },

  //chat access
  isChatAvailable: { type: Boolean, default: false },
  isGroupChatAvailable: { type: Boolean, default: false },
  isCommunityDiscussionAvailable: { type: Boolean, default: false },

  //early access
  isEarlyAccessAvailable: { type: Boolean, default: false },

  //profile update access
  updateProfileAccess: { type: Boolean, default: false },

  expiryTime: { type: Number, dafault: 1 },
}, { timestamps: true }
);

module.exports = mongoose.model('MySubscription', mySubscriptionSchema);