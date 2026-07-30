const mongoose = require('mongoose');
const Item = require('../models/Item');
const Order = require('../models/Order');
const { recordVisitEvent } = require('../middleware/trackerMiddleware');
const BATTERY_COST_RATIO = 0.3;
const BASE_MONTHLY_FEE = 49;
const PER_KM_RATE = 0.05;
const MAX_MONTHLY_KM = 20000;

// counter for the mock payment gateway, lives in app memory so it resets when the server restarts
let paymentAttempts = 0;

// Helper Function: Finds a vehicle using either MongoDB _id or custom vid
const findVehicleByIdOrVid = async (id) => {
  const searchCondition = mongoose.Types.ObjectId.isValid(id)
    ? { _id: id }
    : { vid: id };

  return await Item.findOne(searchCondition);
};

// Helper Function: checks the shipping address has everything the Order schema needs
const getMissingShippingFields = (shippingAddress) => {
  const requiredFields = ['street', 'city', 'province', 'postalCode', 'phone'];

  if (!shippingAddress || typeof shippingAddress !== 'object') {
    return requiredFields;
  }

  return requiredFields.filter(
    (field) => !shippingAddress[field] || String(shippingAddress[field]).trim() === ''
  );
};

// @desc    Process a checkout through the mock payment gateway (every 3rd attempt is denied)
// @route   POST /api/checkout
// @access  Private
const processCheckout = async (req, res) => {
  try {
    const { shippingAddress, items, creditCard } = req.body;

    const missingShippingFields = getMissingShippingFields(shippingAddress);
    if (missingShippingFields.length > 0) {
      return res.status(400).json({
        status: 'Failure',
        message: `Shipping address is missing required fields: ${missingShippingFields.join(', ')}.`
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        status: 'Failure',
        message: 'Checkout requires at least one vehicle in the order.'
      });
    }

    const cardNumber = String(creditCard?.cardNumber || '').replace(/[\s-]/g, '');
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
        message: 'Credit card expiry and CVV are required.'
      });
    }

    // build the order items from the catalog so prices come from the db, not the request
    const orderItems = [];
    let totalPrice = 0;

    for (const item of items) {
      const vehicle = await findVehicleByIdOrVid(item.vehicleId);

      if (!vehicle) {
        return res.status(404).json({
          status: 'Failure',
          message: `Vehicle with id ${item.vehicleId} was not found in the catalog.`
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
        const estimatedMonthlyKm =
          Number(item.batteryLease.estimatedMonthlyKm);

    if (
        !Number.isFinite(estimatedMonthlyKm) ||
        estimatedMonthlyKm < 1 ||
        estimatedMonthlyKm > MAX_MONTHLY_KM
    ) {
        return res.status(400).json({
            status: "Failure",
            message:
                `Battery lease mileage must be between 1 and ${MAX_MONTHLY_KM} km.`
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

    console.log("Battery lease accepted:", {
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
        purchasePrice: purchasePrice,
        selectedCustomizationOptions: item.selectedCustomizationOptions || []
      });

      totalPrice += purchasePrice;
    }

    // only real payment attempts move the counter, bad attempts above dont count
    paymentAttempts += 1;

    const baseOrderData = {
      customer: req.user._id,
      customerEmail: req.user.email,
      shippingAddress,
      items: orderItems,
      totalPrice,
      paymentSummary: {
        cardLastFour: cardNumber.slice(-4) // dont store full card num
      }
    };

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

    // payment went through,so remove from catalog if quantity > 0
    for (const orderItem of orderItems) {
      await Item.updateOne(
        { _id: orderItem.item, quantity: { $gt: 0 } },
        { $inc: { quantity: -1 } }
      );
    }

    await recordVisitEvent({ ip: req.ip, eventtype: 'PURCHASE' });

    return res.status(201).json({
      status: 'Success',
      message: 'Order Successfully Completed.',
      orderId: processedOrder._id,
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
      message: 'Internal server error processing checkout.',
      error: error.message
    });
  }
};

module.exports = {
  processCheckout
};
