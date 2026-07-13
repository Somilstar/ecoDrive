const mongoose = require('mongoose');
const Item = require('../models/Item');

// lease pricing constants, tweak these if the demo numbers feel off
const BATTERY_COST_RATIO = 0.3; // battery is roughly 30% of an EVs value
const BASE_MONTHLY_FEE = 49;
const PER_KM_RATE = 0.05;
const MAX_MONTHLY_KM = 20000;

// Helper Function: finds a vehicle using either MongoDB _id or custom vid
const findVehicleByIdOrVid = async (id) => {
  const searchCondition = mongoose.Types.ObjectId.isValid(id)
    ? { _id: id }
    : { vid: id };

  return await Item.findOne(searchCondition);
};

// @desc    Calculate the usage-based battery leasing subscription for a vehicle
// @route   POST /api/battery-lease/calculate
// @access  Public
const calculateBatteryLease = async (req, res) => {
  try {
    const { vehicleId, estimatedMonthlyKm } = req.body;

    if (!vehicleId) {
      return res.status(400).json({
        status: 'Failure',
        message: 'A vehicle id is required to calculate a battery lease.'
      });
    }

    const monthlyKm = Number(estimatedMonthlyKm);

    if (!Number.isFinite(monthlyKm) || monthlyKm <= 0 || monthlyKm > MAX_MONTHLY_KM) {
      return res.status(400).json({
        status: 'Failure',
        message: `Estimated monthly mileage must be a number between 1 and ${MAX_MONTHLY_KM} km.`
      });
    }

    const vehicle = await findVehicleByIdOrVid(vehicleId);

    if (!vehicle) {
      return res.status(404).json({
        status: 'Failure',
        message: 'Vehicle not found.'
      });
    }

    // the buyer stops owning the battery,its cost comes off the vehicle price and gets replaced by monthly fee that scales with how much they drive
    const upfrontBatteryCost = Math.round(vehicle.price * BATTERY_COST_RATIO);
    const adjustedVehiclePrice = vehicle.price - upfrontBatteryCost;
    const monthlySubscriptionFee = Number((BASE_MONTHLY_FEE + monthlyKm * PER_KM_RATE).toFixed(2));

    return res.status(200).json({
      status: 'Success',
      message: 'Battery lease subscription calculated successfully.',
      vehicleId: vehicle.vid,
      vehicleName: vehicle.name,
      basePrice: vehicle.price,
      upfrontBatteryCost,
      adjustedVehiclePrice,
      estimatedMonthlyKm: monthlyKm,
      monthlySubscriptionFee,
      feeBreakdown: {
        baseMonthlyFee: BASE_MONTHLY_FEE,
        perKmRate: PER_KM_RATE,
        usageCharge: Number((monthlyKm * PER_KM_RATE).toFixed(2))
      }
    });
  } catch (error) {
    return res.status(500).json({
      status: 'Failure',
      message: 'Internal server error calculating battery lease.',
      error: error.message
    });
  }
};

module.exports = {
  calculateBatteryLease
};
