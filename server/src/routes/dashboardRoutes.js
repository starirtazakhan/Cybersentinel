const express = require("express");

const router = express.Router();

const {
    getDashboardOverview,
    getSeverityDistribution,
    getRiskDistribution,
    getIncidentStatusDistribution,
    getRecentAlerts,
    getAttackMapData
} = require("../controllers/dashboardController");

const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");


router.get(
    "/overview",
    authenticate,
    authorize("ADMIN", "ANALYST", "VIEWER"),
    getDashboardOverview
);


router.get(
    "/severity",
    authenticate,
    authorize("ADMIN", "ANALYST", "VIEWER"),
    getSeverityDistribution
);


router.get(
    "/risk",
    authenticate,
    authorize("ADMIN", "ANALYST", "VIEWER"),
    getRiskDistribution
);


router.get(
    "/incident-status",
    authenticate,
    authorize("ADMIN", "ANALYST", "VIEWER"),
    getIncidentStatusDistribution
);


router.get(
    "/recent-alerts",
    authenticate,
    authorize("ADMIN", "ANALYST", "VIEWER"),
    getRecentAlerts
);


router.get(
    "/attack-map",
    authenticate,
    authorize("ADMIN", "ANALYST", "VIEWER"),
    getAttackMapData
);


module.exports = router; 