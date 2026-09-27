const express = require("express");
const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const {
    getMitreOverview
} = require("../controllers/mitreController");

const router = express.Router();

router.get(
    "/",
    authenticate,
    authorize("ADMIN", "ANALYST", "VIEWER"),
    getMitreOverview
);

module.exports = router;