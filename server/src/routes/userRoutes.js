const express = require("express");

const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const {
    getUsers,
    getUserById
} = require("../controllers/userController");

const router = express.Router();

// Get currently authenticated user's profile
router.get("/profile", authenticate, (req, res) => {
    res.status(200).json({
        success: true,
        message: "Profile retrieved successfully",
        user: req.user
    });
});

// Get all users
// Admin only
router.get(
    "/",
    authenticate,
    authorize("ADMIN"),
    getUsers
);

// Get a single user
// Admin only
router.get(
    "/:id",
    authenticate,
    authorize("ADMIN"),
    getUserById
);

module.exports = router;