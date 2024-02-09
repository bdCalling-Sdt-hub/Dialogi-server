const mongoose = require("mongoose");

const chatSchema = mongoose.Schema(
  {
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    }],
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: { type: String, enum: ["pending", "accepted", "blocked"], required: false }
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("Chat", chatSchema);
