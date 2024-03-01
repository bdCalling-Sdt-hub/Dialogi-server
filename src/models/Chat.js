const mongoose = require("mongoose");

const chatSchema = mongoose.Schema(
  {
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    }],
    groupName: {
      type: String,
      default: "New Group"
    },
    type: {
      type: String,
      enum: ["group", "single", "community"],
      default: "single"
    },
    groupAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    image: {
      type: String,
      default: "/uploads/group-chat/group-chat.png",
    },
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("Chat", chatSchema);
