const mongoose = require('mongoose');

const CertificateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['course', 'contest'],
      required: true,
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true, // Can reference a Course or a Contest depending on type
    },
    issuedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Certificate', CertificateSchema);
