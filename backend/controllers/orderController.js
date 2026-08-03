const mongoose = require('mongoose');
const Item = require('../models/Item');
const Order = require('../models/Order');
const { recordVisitEvent } = require('../middleware/trackerMiddleware');

const BATTERY_COST_RATIO = 0.3;
const BASE_MONTHLY_FEE = 49;
const PER_KM_RATE = 0.05;
const MAX_MONTHLY_KM = 20000;

// Combined general sales tax rates for each province and territory.
// These are stored as decimals, so 0.13 means 13%.
const PROVINCE_TAX_RATES = {
  AB: 0.05,
  BC: 0.12,
  MB: 0.12,
  NB: 0.15,
  NL: 0.15,
  NS: 0.14,
  NT: 0.05,
  NU: 0.05,
  ON: 0.13,
  PE: 0.15,
  QC: 0.14975,
  SK: 0.11,
  YT: 0.05
};

// Counter for the mock payment gateway.
// It resets whenever the server restarts.
let paymentAttempts = 0;

// Finds a vehicle using either its MongoDB _id or custom vid.
const findVehicleByIdOrVid = async (id) => {
  const searchCondition = mongoose.Types.ObjectId.isValid(id)
    ? { _id: id }
    : { vid: id };

  return await Item.findOne(searchCondition);
};

// Checks that the shipping address contains every required field.
const getMissingShippingFields = (shippingAddress) => {
  const requiredFields = [
    'fullName',
    'street',
    'city',
    'province',
    'postalCode',
    'phone'
  ];

  if (!shippingAddress || typeof shippingAddress !== 'object') {
    return requiredFields;
  }

  return requiredFields.filter(
    (field) =>
      !shippingAddress[field] ||
      String(shippingAddress[field]).trim() === ''
  );
};

// Returns the tax rate for a province or null if the code is invalid.
const getProvinceTaxRate = (province) => {
  const provinceCode = String(province || '')
    .trim()
    .toUpperCase();

  if (
    !Object.prototype.hasOwnProperty.call(
      PROVINCE_TAX_RATES,
      provinceCode
    )
  ) {
    return null;
  }

  return PROVINCE_TAX_RATES[provinceCode];
};

// Rounds a monetary value to two decimal places.
const roundCurrency = (amount) => {
  return Number(Number(amount).toFixed(2));
};

// @desc    Process a checkout through the mock payment gateway
// @route   POST /api/checkout
// @access  Private
const processCheckout = async (req, res) => {
  try {
    const { shippingAddress, items, creditCard } = req.body;

    const missingShippingFields =
      getMissingShippingFields(shippingAddress);

    if (missingShippingFields.length > 0) {
      return res.status(400).json({
        status: 'Failure',
        message:
          `Shipping address is missing required fields: ` +
          `${missingShippingFields.join(', ')}.`
      });
    }

    const provinceCode = String(shippingAddress.province)
      .trim()
      .toUpperCase();

    const taxRate = getProvinceTaxRate(provinceCode);

    if (taxRate === null) {
      return res.status(400).json({
        status: 'Failure',
        message:
          'A valid Canadian province or territory is required.'
      });
    }

    const normalizedShippingAddress = {
      ...shippingAddress,
      province: provinceCode
    };

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        status: 'Failure',
        message:
          'Checkout requires at least one vehicle in the order.'
      });
    }

    const cardNumber = String(
      creditCard?.cardNumber || ''
    ).replace(/[\s-]/g, '');

    const cvv = String(creditCard?.cvv || '');

    if (!/^\d{13,19}$/.test(cardNumber)) {
      return res.status(400).json({
        status: 'Failure',
        message: 'A valid credit card number is required.'
      });
    }

    if (!/^\d{3,4}$/.test(cvv) || !creditCard?.expiry) {
      return res.status(400).json({
        status: 'Failure',
        message:
          'Credit card expiry and CVV are required.'
      });
    }

    // Build the order using catalog prices instead of prices
    // provided by the browser.
    const orderItems = [];
    let subtotal = 0;

    for (const item of items) {
      const vehicle = await findVehicleByIdOrVid(
        item.vehicleId
      );

      if (!vehicle) {
        return res.status(404).json({
          status: 'Failure',
          message:
            `Vehicle with id ${item.vehicleId} ` +
            `was not found in the catalog.`
        });
      }

      if (vehicle.quantity < 1) {
        return res.status(400).json({
          status: 'Failure',
          message: `Vehicle ${vehicle.name} is out of stock.`
        });
      }

      let purchasePrice = Number(vehicle.price);

      if (item.batteryLease?.accepted === true) {
        const estimatedMonthlyKm = Number(
          item.batteryLease.estimatedMonthlyKm
        );

        if (
          !Number.isFinite(estimatedMonthlyKm) ||
          estimatedMonthlyKm < 1 ||
          estimatedMonthlyKm > MAX_MONTHLY_KM
        ) {
          return res.status(400).json({
            status: 'Failure',
            message:
              `Battery lease mileage must be between 1 ` +
              `and ${MAX_MONTHLY_KM} km.`
          });
        }

        const batteryValue = Math.round(
          Number(vehicle.price) * BATTERY_COST_RATIO
        );

        purchasePrice =
          Number(vehicle.price) - batteryValue;

        const monthlySubscriptionFee = Number(
          (
            BASE_MONTHLY_FEE +
            estimatedMonthlyKm * PER_KM_RATE
          ).toFixed(2)
        );

        console.log('Battery lease accepted:', {
          vehicleId: vehicle.vid,
          originalVehiclePrice: Number(vehicle.price),
          batteryValueRemoved: batteryValue,
          adjustedVehiclePrice: purchasePrice,
          estimatedMonthlyKm,
          monthlySubscriptionFee
        });
      }

      orderItems.push({
        vehicleId: vehicle.vid,
        item: vehicle._id,
        purchasePrice,
        selectedCustomizationOptions:
          item.selectedCustomizationOptions || []
      });

      subtotal = roundCurrency(
        subtotal + purchasePrice
      );
    }

    // Calculate tax on the server so it cannot be modified
    // by the browser.
    const taxAmount = roundCurrency(
      subtotal * taxRate
    );

    const totalPrice = roundCurrency(
      subtotal + taxAmount
    );

    // Only real payment attempts move the counter.
    paymentAttempts += 1;

    const baseOrderData = {
      customer: req.user._id,
      customerEmail: req.user.email,
      shippingAddress: normalizedShippingAddress,
      items: orderItems,
      subtotal,
      taxRate,
      taxAmount,
      totalPrice,
      paymentSummary: {
        // Never store the complete card number.
        cardLastFour: cardNumber.slice(-4)
      }
    };

    // Every third payment attempt is denied.
    if (paymentAttempts % 3 === 0) {
      const deniedOrder = await Order.create({
        ...baseOrderData,
        status: 'DENIED'
      });

      return res.status(400).json({
        status: 'Failure',
        message: 'Credit Card Authorization Failed.',
        orderId: deniedOrder._id
      });
    }

    const processedOrder = await Order.create({
      ...baseOrderData,
      status: 'PROCESSED'
    });

    // Payment succeeded, so reduce the available quantity.
    for (const orderItem of orderItems) {
      await Item.updateOne(
        {
          _id: orderItem.item,
          quantity: { $gt: 0 }
        },
        {
          $inc: { quantity: -1 }
        }
      );
    }

    await recordVisitEvent({
      ip: req.ip,
      eventtype: 'PURCHASE'
    });

    return res.status(201).json({
      status: 'Success',
      message: 'Order Successfully Completed.',
      orderId: processedOrder._id,
      subtotal: processedOrder.subtotal,
      taxRate: processedOrder.taxRate,
      taxAmount: processedOrder.taxAmount,
      totalPrice: processedOrder.totalPrice,
      orderStatus: processedOrder.status
    });
  } catch (error) {
    if (error?.name === 'ValidationError') {
      return res.status(400).json({
        status: 'Failure',
        message: error.message
      });
    }

    return res.status(500).json({
      status: 'Failure',
      message:
        'Internal server error processing checkout.',
      error: error.message
    });
  }
};

// @desc    Get one order belonging to the logged-in customer
// @route   GET /api/orders/:orderId
// @access  Private
const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        status: 'Failure',
        message: 'Invalid order ID.'
      });
    }

    // Including the customer in the query prevents users
    // from viewing orders belonging to another account.
    const order = await Order.findOne({
      _id: orderId,
      customer: req.user._id
    }).populate({
      path: 'items.item',
      select: 'name brand model modelYear'
    });

    if (!order) {
      return res.status(404).json({
        status: 'Failure',
        message: 'Order was not found.'
      });
    }

    return res.status(200).json({
      status: 'Success',
      order
    });
  } catch (error) {
    return res.status(500).json({
      status: 'Failure',
      message:
        'Internal server error retrieving order.',
      error: error.message
    });
  }
};

module.exports = {
  processCheckout,
  getOrderById
};