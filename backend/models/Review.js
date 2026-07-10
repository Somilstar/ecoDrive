const mongoose = require('mongoose');

// Stores customer reviews and ratings for vehicles
const ReviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },

    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      trim: true,
      maxlength: 1000
    }
  },
  {
    // automatically adds createdAt and updatedAt
    timestamps: true
  }
);

// Prevents the same user from reviewing the same vehicle more than once.
ReviewSchema.index({ user: 1, vehicle: 1 }, { unique: true });

module.exports = mongoose.model('Review', ReviewSchema);