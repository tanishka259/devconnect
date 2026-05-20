const mongoose = require("mongoose");

const codeRoomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
    },

    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      default: "",
    },

    language: {
      type: String,
      default: "javascript",
    },

    difficulty: {
      type: String,
      default: "Beginner",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CodeRoom", codeRoomSchema);