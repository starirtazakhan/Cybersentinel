const Alert = require("../models/Alert");

// Get all alerts
const getAlerts = async (req, res) => {
    try {
        const alerts = await Alert.find()
            .populate("createdBy", "name email role")
            .populate("assignedTo", "name email role")
            .populate("relatedEvents")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: alerts.length,
            alerts
        });

    } catch (error) {
        console.error("Get alerts error:", error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


// Get a single alert
const getAlertById = async (req, res) => {
    try {
        const alert = await Alert.findById(req.params.id)
            .populate("createdBy", "name email role")
            .populate("assignedTo", "name email role")
            .populate("relatedEvents");

        if (!alert) {
            return res.status(404).json({
                success: false,
                message: "Alert not found"
            });
        }

        res.status(200).json({
            success: true,
            alert
        });

    } catch (error) {
        console.error("Get alert error:", error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


module.exports = {
    getAlerts,
    getAlertById
};