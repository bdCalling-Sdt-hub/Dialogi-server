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
      required: false,
    },
    type: {
      type: String,
      required: false,
    },
    groupAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    image: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("Chat", chatSchema);
