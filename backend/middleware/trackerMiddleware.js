const VisitEvent = require('../models/VisitEvent');
const tracker = async (req, res, next) => {
    try {
        await VisitEvent.create({
            ipaddress: req.ip,
            day: new Date().toLocaleDateString('en-CA').replace(/-/g, ''),
            vid: req.body.vid || null,
            eventtype: req.body.eventtype
        });
        next();
    } catch (error) {
        console.error('Error tracking visit event:', error);
        next(error);
    }
};

module.exports = tracker;