const mongoose = require('mongoose');

// reusable address schema for shipping and billing details
const AddressSchema = new mongoose.Schema(
  {
    // trim removes extra spaces from the beginning/end of strings
    street: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    province: { type: String, trim: true, default: '' },
    country: { type: String, trim: true, default: 'Canada' },
    postalCode: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' }
  },
  {
    // Address is embedded inside User, so it does not need its own _id.
    _id: false
  }
);

// Main user/account schema for customers and admins.
const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,

      // required with a custom validation message
      required: [true, 'Email is required'],

      // each account should have a different email
      unique: true,

      // store emails in lowercase so Login@Email.com and login@email.com match
      lowercase: true,

      // remove extra spaces before saving
      trim: true,

      // basic email format check
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },

    password: {
      type: String,

      // password is required for login/register
      required: [true, 'Password is required'],

      // minimum password length rule
      minlength: [6, 'Password must be at least 6 characters long'],

      // prevents password hash from being returned in normal User queries
      select: false
    },

    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true
    },

    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true
    },

    role: {
      type: String,

      // only allow these two account types
      enum: ['customer', 'admin'],

      // normal users are customers unless we explicitly make them admins
      default: 'customer'
    },

    // Saved address used during checkout/shipping.
    shippingAddress: {
      type: AddressSchema,
      default: () => ({})
    },

    // Optional separate billing address.
    billingAddress: {
      type: AddressSchema,
      default: () => ({})
    }
  },
  {
    // automatically adds createdAt and updatedAt
    timestamps: true,

    // include virtual fields like `id` when converting to JSON/object
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Adds a cleaner `id` field based on MongoDB's default `_id`.
UserSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

// Exports the User model so controllers/routes can use it.
module.exports = mongoose.model('User', UserSchema);