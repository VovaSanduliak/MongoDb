const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
    required: true,
  },
  experience: {
    type: Number,
    required: true,
  },
  salary: {
    type: Number,
    required: true,
  },
  skills: {
    type: [String],
    required: true,
  },
});

const User = mongoose.model("User", userSchema);

module.exports = User;
