const express = require("express");

const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const {
    getNotifications
} = require("../controllers/notificationController");

const router = express.Router();

router.get(
    "/",
    authenticate,
    authorize("ADMIN", "ANALYST", "VIEWER"),
    getNotifications
);

module.exports = router;