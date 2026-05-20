const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    bio: {
      type: String,
      default: "",
    },

    skills: {
      type: [String],
      default: [],
    },

    githubUsername: {
      type: String,
      default: "",
    },

    location: {
      type: String,
      default: "",
    },

    role: {
      type: String,
      default: "Developer",
    },

    avatar: {
      type: String,
      default: "",
    },

    connections: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
],

connectionRequests: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
],
  },
  {
    timestamps: true,
  }

  
);



module.exports = mongoose.model("User", userSchema);