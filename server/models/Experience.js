const mongoose = require("mongoose");

const experienceSchema = new mongoose.Schema({
  developerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  skillLevel: {
    type: String,
  },
});

const Experience = mongoose.model("Experience", experienceSchema);

module.exports = Experience;
