const mongoose = require('mongoose');

// Stores accident/damage information for a vehicle.
const HistoryReportSchema = new mongoose.Schema(
  {
    hasAccidents: {
      type: Boolean,
      default: false
    },

    damageDescription: {
      type: String,
      trim: true,
      default: 'No reported accidents or damages.'
    }
  },
  {
    // History report is embedded inside Item, so it does not need its own _id.
    _id: false
  }
);

// Main vehicle schema used by the catalog.
const ItemSchema = new mongoose.Schema(
  {
    vid: {
      type: String,
      required: [true, 'Vehicle ID is required'],
      unique: true,
      trim: true
    },

    name: {
      type: String,
      required: [true, 'Vehicle name is required'],
      trim: true
    },

    description: {
      type: String,
      required: [true, 'Vehicle description is required'],
      trim: true
    },

    brand: {
      type: String,
      required: [true, 'Vehicle brand is required'],
      trim: true
    },

    model: {
      type: String,
      required: [true, 'Vehicle model is required'],
      trim: true
    },

    shape: {
      type: String,
      required: true,

      // Allowed body types - we can expand on this if needed
      enum: ['Sedan', 'SUV', 'Hatchback', 'Truck']
    },

    modelYear: {
      type: Number,
      required: true,
      min: 1990
    },

    mileage: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },

    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 1
    },

    price: {
      type: Number,
      required: true,
      min: 0
    },

    isHotDeal: {
      type: Boolean,
      default: false
    },

    // Customization fields
    exteriorColor: {
      type: String,
      required: true,
      trim: true
    },

    interiorColor: {
      type: String,
      required: true,
      trim: true
    },

    interiorFabric: {
      type: String,
      required: true,
      enum: ['Leather', 'Fabric', 'Vegan Suede']
    },

    historyReport: {
      type: HistoryReportSchema,
      default: () => ({})
    }
  },
  {
    // automatically adds createdAt and updatedAt
    timestamps: true
  }
);

// Indexes for common catalog filtering and sorting.
ItemSchema.index({ brand: 1 });
ItemSchema.index({ price: 1 });
ItemSchema.index({ mileage: 1 });
ItemSchema.index({ isHotDeal: 1 });
ItemSchema.index({ shape: 1, modelYear: 1 });

module.exports = mongoose.model('Item', ItemSchema);