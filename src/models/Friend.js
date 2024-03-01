const mongoose = require("mongoose");

const friendSchema = mongoose.Schema(
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
    status: { type: String, enum: ["pending", "accepted", "rejected"], default:"pending" }
  },
  {
    timestamps: true,
  }
);
module.exports = mongoose.model("Friend", friendSchema);
