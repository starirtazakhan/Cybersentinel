const Alert = require("../models/Alert");
const Incident = require("../models/Incident");
const SecurityEvent = require("../models/SecurityEvent");

const getNotifications = async (req, res) => {
    try {
        const [alerts, incidents, events] = await Promise.all([
            Alert.find()
                .sort({ createdAt: -1 })
                .limit(10),

            Incident.find()
                .sort({ createdAt: -1 })
                .limit(10),

            SecurityEvent.find()
                .sort({ createdAt: -1 })
                .limit(10)
        ]);

        const notifications = [
            ...alerts.map((alert) => ({
                id: `alert-${alert._id}`,
                type: "ALERT",
                title: alert.title,
                message: alert.description,
                severity: alert.severity,
                status: alert.status,
                sourceIp: alert.sourceIp,
                createdAt: alert.createdAt
            })),

            ...incidents.map((incident) => ({
                id: `incident-${incident._id}`,
                type: "INCIDENT",
                title: incident.title,
                message: incident.description,
                severity: incident.severity,
                status: incident.status,
                sourceIp: incident.sourceIp,
                createdAt: incident.createdAt
            })),

            ...events.map((event) => ({
                id: `event-${event._id}`,
                type: "EVENT",
                title: event.eventType,
                message: event.description,
                severity: event.severity,
                status: event.status,
                sourceIp: event.sourceIp,
                createdAt: event.createdAt
            }))
        ];

        // Newest notifications first
        notifications.sort(
            (a, b) =>
                new Date(b.createdAt) -
                new Date(a.createdAt)
        );

        const latestNotifications = notifications.slice(0, 15);

        const unreadCount = latestNotifications.filter(
            (notification) =>
                notification.status !== "RESOLVED" &&
                notification.status !== "CLOSED" &&
                notification.status !== "FALSE_POSITIVE"
        ).length;

        res.status(200).json({
            success: true,
            unreadCount,
            count: latestNotifications.length,
            notifications: latestNotifications
        });

    } catch (error) {
        console.error("Notification error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to load notifications"
        });
    }
};

module.exports = {
    getNotifications
};