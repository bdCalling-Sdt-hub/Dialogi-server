const mongoose = require('mongoose');

const messageSchema = mongoose.Schema(
  {
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    message: {
      type: String,
      required: false
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      required: false,
    },
    messageType:{
      type: String,
      enum: ["normal", "notice", "question"],
      default: "normal"
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Message', messageSchema);