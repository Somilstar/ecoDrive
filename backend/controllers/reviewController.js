const mongoose = require('mongoose');
const Item = require('../models/Item');
const Review = require('../models/Review');

// Helper Function: Finds a vehicle using either MongoDB _id or custom vid
const findVehicleByIdOrVid = async (id) => {
  const searchCondition = mongoose.Types.ObjectId.isValid(id)
    ? { _id: id }
    : { vid: id };

  return await Item.findOne(searchCondition);
};

// @desc    Add a review and star rating for a specific vehicle
// @route   POST /api/vehicles/:id/reviews
// @access  Private
const addReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment, review, rating } = req.body;

    const reviewComment = comment || review;

    if (!reviewComment || reviewComment.trim() === '') {
      return res.status(400).json({
        status: 'Failure',
        message: 'Review comment is required.'
      });
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        status: 'Failure',
        message: 'Rating must be an integer between 1 and 5.'
      });
    }

    const vehicle = await findVehicleByIdOrVid(id);

    if (!vehicle) {
      return res.status(404).json({
        status: 'Failure',
        message: 'Vehicle not found.'
      });
    }

    const newReview = await Review.create({
      user: req.user._id,
      vehicle: vehicle._id,
      rating,
      comment: reviewComment.trim()
    });

    return res.status(201).json({
      status: 'Success',
      message: 'Review submitted successfully.',
      review: newReview
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({
        status: 'Failure',
        message: 'You have already submitted a review for this vehicle.'
      });
    }

    if (error?.name === 'ValidationError') {
      return res.status(400).json({
        status: 'Failure',
        message: error.message
      });
    }

    return res.status(500).json({
      status: 'Failure',
      message: 'Internal server error submitting vehicle review.',
      error: error.message
    });
  }
};

// @desc    Retrieve all reviews and average star rating for a specific vehicle
// @route   GET /api/vehicles/:id/reviews
// @access  Public
const getVehicleReviews = async (req, res) => {
  try {
    const { id } = req.params;

    const vehicle = await findVehicleByIdOrVid(id);

    if (!vehicle) {
      return res.status(404).json({
        status: 'Failure',
        message: 'Vehicle not found.'
      });
    }

    const reviews = await Review.find({ vehicle: vehicle._id })
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 });

    const averageRating =
      reviews.length === 0
        ? 0
        : reviews.reduce((sum, currentReview) => sum + currentReview.rating, 0) / reviews.length;

    return res.status(200).json({
      status: 'Success',
      message: 'Vehicle reviews retrieved successfully.',
      vehicleId: vehicle._id,
      vehicleName: vehicle.name,
      reviewCount: reviews.length,
      averageRating: Number(averageRating.toFixed(1)),
      reviews
    });
  } catch (error) {
    return res.status(500).json({
      status: 'Failure',
      message: 'Internal server error retrieving vehicle reviews.',
      error: error.message
    });
  }
};

module.exports = {
  addReview,
  getVehicleReviews
};