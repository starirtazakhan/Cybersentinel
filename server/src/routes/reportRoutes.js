const express = require("express");
const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const {
    getReport
} = require("../controllers/reportController");

const router = express.Router();

// All authenticated SOC users can view reports
router.get(
    "/",
    authenticate,
    authorize("ADMIN", "ANALYST", "VIEWER"),
    getReport
);

module.exports = router;