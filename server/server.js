const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");

const authRoutes = require("./src/routes/authRoutes");
const userRoutes = require("./src/routes/userRoutes");
const eventRoutes = require("./src/routes/eventRoutes");
const alertRoutes = require("./src/routes/alertRoutes");
const incidentRoutes = require("./src/routes/incidentRoutes");
const auditRoutes = require("./src/routes/auditRoutes");
const dashboardRoutes = require("./src/routes/dashboardRoutes");
const ThreatIntelligenceRoutes = require("./src/routes/ThreatIntelligenceRoutes");
const mitreRoutes = require("./src/routes/mitreRoutes");
const reportRoutes = require("./src/routes/reportRoutes");
const searchRoutes = require("./src/routes/searchRoutes");
const notificationRoutes = require("./src/routes/notificationRoutes");

const connectDB = require("./src/config/db");
const { startThreatSimulator } = require("./src/services/threatSImulator");

dotenv.config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use(
    "/api/threat-intelligence",
    ThreatIntelligenceRoutes
);
app.use("/api/mitre", mitreRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/notifications", notificationRoutes);

// Test route
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "CyberSentinel API is running"
    });
});

const PORT = process.env.PORT || 5000;

// Start server
const startServer = async () => {
    try {
        await connectDB();

        await startThreatSimulator();

        app.listen(PORT, () => {
            console.log(
                `CyberSentinel server running on port ${PORT}`
            );
        });

    } catch (error) {
        console.error("Server startup error:", error);
        process.exit(1);
    }
};

startServer();
