const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  name:{type: String, required: false},
  type:{type: String, enum:["default", "premium","premium-plus"],required: false},
  
  isChatAvailable:{type: Boolean, required: false},
  isGroupChatAvailable:{type: Boolean, required: false},
  isCommunityDiscussionAvailable:{type: Boolean, required: false},

  isAddAvailable:{type: Boolean, required: false},
  categoryAccessNumber:{type: Number, required: false},
  isCategoryAccessUnlimited:{type: Boolean, required: false},
  questionAccessNumber:{type: Number, required: false},
  isQuestionAccessUnlimited:{type: Boolean, required: false},
  shareAccess:{type: Boolean, required: false},
  isEarlyAccessAvailable:{type: Boolean, required: false},
}, { timestamps: true }
);

module.exports = mongoose.model('Subscription', subscriptionSchema);