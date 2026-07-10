const mongoose = require('mongoose');

// Tracks basic usage events for admin analytics
const VisitEventSchema = new mongoose.Schema(
  {
    ipaddress: {
      type: String,
      required: true,
      trim: true
    },

    // Stored as a string so reports can group activity by day
    // Here is an Example format: "07102026"
    day: {
      type: String,
      required: true,
      trim: true
    },

    // Vehicle ID is optional because some events may not be tied to a specific vehicle
    vid: {
      type: String,
      trim: true,
      default: null
    },

    eventtype: {
      type: String,
      required: true,
      enum: ['VIEW', 'CART', 'PURCHASE']
    }
  },
  {
    // automatically adds createdAt and updatedAt
    timestamps: true
  }
);

// Helps speed up analytics queries grouped by day, event type, or vehicle.
VisitEventSchema.index({ day: 1 });
VisitEventSchema.index({ eventtype: 1 });
VisitEventSchema.index({ vid: 1 });

module.exports = mongoose.model('VisitEvent', VisitEventSchema);