const express = require("express");

const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const {
    getThreatIntelligence
} = require("../controllers/ThreatIntelligenceController");

const router = express.Router();

// All authenticated SOC users can view threat intelligence
router.get(
    "/",
    authenticate,
    authorize("ADMIN", "ANALYST", "VIEWER"),
    getThreatIntelligence
);

module.exports = router;