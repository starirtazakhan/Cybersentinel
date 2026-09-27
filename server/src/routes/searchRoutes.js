const express = require("express");

const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const {
    globalSearch
} = require("../controllers/searchController");

const router = express.Router();

router.get(
    "/",
    authenticate,
    authorize("ADMIN", "ANALYST", "VIEWER"),
    globalSearch
);

module.exports = router;