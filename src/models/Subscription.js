const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  name:{type: String, required: false},
  type:{type: String, enum:["default", "premium","premium-plus"],required: false},

  //show add
  isAddAvailable:{type: Boolean, default: false},

  //category access
  categoryAccessNumber:{type: Number, default: 0},
  isCategoryAccessUnlimited:{type: Boolean, default: false},

  //question access
  questionAccessNumber:{type: Number, default: 0},
  isQuestionAccessUnlimited:{type: Boolean, default: false},
  
  //chat access
  isChatAvailable:{type: Boolean, default: false},
  isGroupChatAvailable:{type: Boolean, default: false},
  isCommunityDiscussionAvailable:{type: Boolean, default: false},

  //early access
  isEarlyAccessAvailable:{type: Boolean, default: false},
  
  //profile update access
  updateProfileAccess:{type: Boolean, default: false},
}, { timestamps: true }
);

module.exports = mongoose.model('Subscription', subscriptionSchema);