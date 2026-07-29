const Order = require('../models/Order');
const VisitEvent = require('../models/VisitEvent');

const getSalesReport = async (req, res) => {
  try {
    const currentDate = new Date();
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const startOfNextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    const salesByBrand = await Order.aggregate([
        {
            $match: {
                status: 'PROCESSED',
                createdAt: { $gte: startOfMonth, $lt: startOfNextMonth }
            }
        },
        {
            $unwind: '$items'
        },
       {
        $lookup:{
            from: 'items',
            localField: 'items.item',
            foreignField: '_id',
            as: 'vehicleDetails'
        }
       },
       {
        $unwind: {
            path: '$vehicleDetails',
            preserveNullAndEmptyArrays: false
        }
       },
       {
        $group:{
            _id: '$vehicleDetails.brand',
            vehiclesSold:{ $sum: 1},
            salesRevenue: { $sum: '$items.purchasePrice' }
        }
       },
       {
        $project: {
            _id: 0,
            brand: '$_id',
            vehiclesSold: 1,
            salesRevenue: 1
        }
       },

       {
        $sort:{vehiclesSold: -1}
       }
    ]);

    const totalVehiclesSold = salesByBrand.reduce((total, brand) => total + brand.vehiclesSold, 0);
    const totalSalesRevenue = salesByBrand.reduce((total, brand) => total + brand.salesRevenue, 0);

    return res.status(200).json({
        status: 'Success',
        month: currentDate.toLocaleString('en-CA', { month: 'long', year: 'numeric' }),
        totalVehiclesSold,
        totalSalesRevenue,
        salesByBrand
    });
  } catch (error) {
    console.error('Sales Report Error Logged:', error);
    return res.status(500).json({ status: 'Failure', message: 'Internal server error generating sales report.' });
  }
};
        
const getVisitReport = async (req, res) => {
    try {
        const VisitResults = await VisitEvent.aggregate([
            {
                $group: {
                    _id: '$eventtype',
                    totalVisits: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    eventType: '$_id',
                    totalVisits: 1
                }
            }
        ]);
const trafficMetrics = {
    VIEW: 0,
    CART: 0,
    PURCHASE: 0
};

VisitResults.forEach((result) => {
    if (Object.prototype.hasOwnProperty.call(trafficMetrics, result.eventType)) {
        trafficMetrics[result.eventType] = result.totalVisits;
    }
});

const totalEvents = trafficMetrics.VIEW + trafficMetrics.CART + trafficMetrics.PURCHASE;

return res.status(200).json({
    status: 'Success',
    totalEvents,
    trafficMetrics
});
    } catch (error) {
        console.error('Visit Report Error Logged:', error);
        return res.status(500).json({ status: 'Failure', message: 'Internal server error generating visit report.' });
    }
};

module.exports = {
    getSalesReport,
    getVisitReport
};  
