const express = require("express");

const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const {
    getAlerts,
    getAlertById
} = require("../controllers/alertController");

const router = express.Router();


// View all alerts
router.get(
    "/",
    authenticate,
    authorize("ADMIN", "ANALYST", "VIEWER"),
    getAlerts
);


// View a specific alert
router.get(
    "/:id",
    authenticate,
    authorize("ADMIN", "ANALYST", "VIEWER"),
    getAlertById
);

module.exports = router;