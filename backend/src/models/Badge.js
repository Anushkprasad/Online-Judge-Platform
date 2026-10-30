const mongoose = require('mongoose');

const BadgeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    icon: {
      type: String, // String identifier or remote URL
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Badge', BadgeSchema);
