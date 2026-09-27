const express = require("express");

const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const AuditLog = require("../models/AuditLog");

const router = express.Router();


// Get audit logs
router.get(
    "/",
    authenticate,
    authorize("ADMIN"),
    async (req, res) => {
        try {
            const logs = await AuditLog.find()
                .populate("performedBy", "name email role")
                .sort({ createdAt: -1 });

            res.status(200).json({
                success: true,
                count: logs.length,
                logs
            });

        } catch (error) {
            console.error("Audit log retrieval error:", error);

            res.status(500).json({
                success: false,
                message: "Server error"
            });
        }
    }
);

module.exports = router;