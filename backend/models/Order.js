const mongoose = require('mongoose');

// Shipping address used for this specific order.
const ShippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    province: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true, default: 'Canada' },
    postalCode: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true }
  },
  {
    // Address is embedded inside Order, so it does not need its own _id.
    _id: false
  }
);

// Each object in this schema represents one vehicle purchased in the order.
const OrderItemSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: String,
      required: true,
      trim: true
    },

    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true
    },

    // Saves the price at checkout time in case the catalog price changes later.
    purchasePrice: {
      type: Number,
      required: true,
      min: 0
    },

    selectedCustomizationOptions: {
      type: [String],
      default: []
    }
  },
  {
    // Order items are embedded inside Order, so they do not need their own _id.
    _id: false
  }
);

// Main purchase order schema
const OrderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    customerEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },

    shippingAddress: {
      type: ShippingAddressSchema,
      required: true
    },

    items: {
      type: [OrderItemSchema],
      required: true,
      validate: {
        validator(items) {
          return items.length > 0;
        },
        message: 'An order must contain at least one vehicle.'
      }
    },

    status: {
      type: String,
      enum: ['ORDERED', 'PROCESSED', 'DENIED'],
      default: 'ORDERED'
    },

    // Total before tax.
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },

    // Stored as a decimal. For example, Ontario's 13% is stored as 0.13.
    taxRate: {
      type: Number,
      required: true,
      min: 0,
      max: 1
    },

    taxAmount: {
      type: Number,
      required: true,
      min: 0
    },

    // Final amount after tax.
    totalPrice: {
      type: Number,
      required: true,
      min: 0
    },

    paymentSummary: {
      cardLastFour: {
        type: String,
        required: true,
        match: [/^\d{4}$/, 'Only the last four card digits should be stored'] // security reasons
      }
    }
  },
  {
    // automatically adds createdAt and updatedAt
    timestamps: true
  }
);

// Useful for finding a customer's recent orders.
OrderSchema.index({ customer: 1, createdAt: -1 }); // customer's orders, newest first

// Useful for admin/order processing filters.
OrderSchema.index({ status: 1 }); // filtering orders by checkout/payment status

module.exports = mongoose.model('Order', OrderSchema);