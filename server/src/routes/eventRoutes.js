const express = require("express");

const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const {
    createEvent,
    getEvents
} = require("../controllers/eventController");

const router = express.Router();


// View security events
router.get(
    "/",
    authenticate,
    authorize("ADMIN", "ANALYST", "VIEWER"),
    getEvents
);


// Create security event
router.post(
    "/",
    authenticate,
    authorize("ADMIN", "ANALYST"),
    createEvent
);


module.exports = router;