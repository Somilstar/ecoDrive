const mongoose = require('mongoose');
const Item = require('../models/Item');

// Helper Function: Builds sorting configuration for catalog queries
const buildSortOptions = (sortPrice, sortMileage) => {
  const sortOptions = {};

  if (sortPrice === 'asc') {
    sortOptions.price = 1;
  } else if (sortPrice === 'desc') {
    sortOptions.price = -1;
  }

  if (sortMileage === 'low-to-high' || sortMileage === 'asc') {
    sortOptions.mileage = 1;
  } else if (sortMileage === 'high-to-low' || sortMileage === 'desc') {
    sortOptions.mileage = -1;
  }

  return sortOptions;
};

// @desc    Retrieve full vehicle catalog with optional sorting and Hot Deals separation
// @route   GET /api/vehicles
// @access  Public
const getVehicles = async (req, res) => {
  try {
    const { sortPrice, sortMileage, hotDeals } = req.query;

    const sortOptions = buildSortOptions(sortPrice, sortMileage);

    const vehicles = await Item.find().sort(sortOptions);

    if (hotDeals === 'true') {
      const hotDealVehicles = vehicles.filter((vehicle) => vehicle.isHotDeal === true);
      const regularVehicles = vehicles.filter((vehicle) => vehicle.isHotDeal === false);

      return res.status(200).json({
        status: 'Success',
        message: 'Vehicle catalog retrieved with Hot Deals separated.',
        hotDealCount: hotDealVehicles.length,
        vehicleCount: regularVehicles.length,
        hotDeals: hotDealVehicles,
        vehicles: regularVehicles
      });
    }

    return res.status(200).json({
      status: 'Success',
      message: 'Vehicle catalog retrieved successfully.',
      count: vehicles.length,
      vehicles
    });
  } catch (error) {
    return res.status(500).json({
      status: 'Failure',
      message: 'Internal server error retrieving vehicle catalog.',
      error: error.message
    });
  }
};

// @desc    Filter vehicles by brand, shape, model year, and accident history
// @route   GET /api/vehicles/filter
// @access  Public
const filterVehicles = async (req, res) => {
  try {
    const { brand, shape, modelYear } = req.query;
    const hasAccidents = req.query.hasAccidents ?? req.query['historyReport.hasAccidents'];

    const filter = {};

    if (brand) {
      filter.brand = brand.trim();
    }

    if (shape) {
      filter.shape = shape.trim();
    }

    if (modelYear) {
      const parsedModelYear = Number(modelYear);

      if (!Number.isInteger(parsedModelYear)) {
        return res.status(400).json({
          status: 'Failure',
          message: 'modelYear must be a valid integer.'
        });
      }

      filter.modelYear = parsedModelYear;
    }

    if (hasAccidents !== undefined) {
      if (hasAccidents !== 'true' && hasAccidents !== 'false') {
        return res.status(400).json({
          status: 'Failure',
          message: 'hasAccidents must be either true or false.'
        });
      }

      filter['historyReport.hasAccidents'] = hasAccidents === 'true';
    }

    const vehicles = await Item.find(filter);

    return res.status(200).json({
      status: 'Success',
      message: 'Filtered vehicles retrieved successfully.',
      count: vehicles.length,
      filtersApplied: filter,
      vehicles
    });
  } catch (error) {
    return res.status(500).json({
      status: 'Failure',
      message: 'Internal server error filtering vehicle catalog.',
      error: error.message
    });
  }
};

// @desc    Retrieve full details for one specific electric vehicle
// @route   GET /api/vehicles/:id
// @access  Public
const getVehicleById = async (req, res) => {
  try {
    const { id } = req.params;

    const searchCondition = mongoose.Types.ObjectId.isValid(id)
      ? { _id: id }
      : { vid: id };

    const vehicle = await Item.findOne(searchCondition);

    if (!vehicle) {
      return res.status(404).json({
        status: 'Failure',
        message: 'Vehicle not found.'
      });
    }

    return res.status(200).json({
      status: 'Success',
      message: 'Vehicle details retrieved successfully.',
      vehicle
    });
  } catch (error) {
    return res.status(500).json({
      status: 'Failure',
      message: 'Internal server error retrieving vehicle details.',
      error: error.message
    });
  }
};

// @desc    Compare multiple vehicles side-by-side
// @route   POST /api/vehicles/compare
// @access  Public
const compareVehicles = async (req, res) => {
  try {
    const { vehicleIds } = req.body;

    if (!Array.isArray(vehicleIds) || vehicleIds.length < 2) {
      return res.status(400).json({
        status: 'Failure',
        message: 'Please provide at least two vehicle IDs for comparison.'
      });
    }

    const objectIds = vehicleIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
    const customVehicleIds = vehicleIds.filter((id) => !mongoose.Types.ObjectId.isValid(id));

    const vehicles = await Item.find({
      $or: [
        { _id: { $in: objectIds } },
        { vid: { $in: customVehicleIds } }
      ]
    });

    return res.status(200).json({
      status: 'Success',
      message: 'Vehicle comparison details retrieved successfully.',
      requestedCount: vehicleIds.length,
      returnedCount: vehicles.length,
      vehicles
    });
  } catch (error) {
    return res.status(500).json({
      status: 'Failure',
      message: 'Internal server error comparing vehicles.',
      error: error.message
    });
  }
};

module.exports = {
  getVehicles,
  filterVehicles,
  getVehicleById,
  compareVehicles
};