const VisitEvent = require('../models/VisitEvent');

const recordVisitEvent = async ({ ip, vid, eventtype }) => {
    try {
        await VisitEvent.create({
            ipaddress: ip,
            day: new Date().toLocaleDateString('en-CA').replace(/-/g, ''),
            vid: vid || null,
            eventtype
        });
    } catch (error) {
        console.error('Error tracking visit event:', error);
    }
};

const tracker = (eventtype) => async (req, res, next) => {
    await recordVisitEvent({ ip: req.ip, vid: req.params.id || req.body.vid, eventtype });
    next();
};

module.exports = { tracker, recordVisitEvent };
