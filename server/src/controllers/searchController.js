const SecurityEvent = require("../models/SecurityEvent");
const Alert = require("../models/Alert");
const Incident = require("../models/Incident");

const globalSearch = async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || !q.trim()) {
            return res.status(200).json({
                success: true,
                count: 0,
                results: []
            });
        }

        const search = q.trim();

        const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

        const [alerts, incidents, events] = await Promise.all([
            Alert.find({
                $or: [
                    { title: regex },
                    { description: regex },
                    { alertType: regex },
                    { severity: regex },
                    { status: regex },
                    { sourceIp: regex },
                    { username: regex }
                ]
            })
                .populate("assignedTo", "name email role")
                .sort({ createdAt: -1 })
                .limit(20),

            Incident.find({
                $or: [
                    { title: regex },
                    { description: regex },
                    { incidentType: regex },
                    { severity: regex },
                    { status: regex },
                    { riskLevel: regex },
                    { sourceIp: regex },
                    { username: regex },
                    { "mitreTechnique.id": regex },
                    { "mitreTechnique.name": regex },
                    { "mitreTechnique.tactic": regex }
                ]
            })
                .populate("assignedTo", "name email role")
                .sort({ createdAt: -1 })
                .limit(20),

            SecurityEvent.find({
                $or: [
                    { eventType: regex },
                    { source: regex },
                    { sourceIp: regex },
                    { destinationIp: regex },
                    { username: regex },
                    { description: regex },
                    { severity: regex },
                    { status: regex }
                ]
            })
                .sort({ createdAt: -1 })
                .limit(20)
        ]);

        const results = [
            ...alerts.map((item) => ({
                id: item._id,
                type: "ALERT",
                title: item.title,
                description: item.description,
                severity: item.severity,
                status: item.status,
                sourceIp: item.sourceIp,
                username: item.username,
                alertType: item.alertType,
                createdAt: item.createdAt
            })),

            ...incidents.map((item) => ({
                id: item._id,
                type: "INCIDENT",
                title: item.title,
                description: item.description,
                severity: item.severity,
                status: item.status,
                riskScore: item.riskScore,
                riskLevel: item.riskLevel,
                sourceIp: item.sourceIp,
                username: item.username,
                incidentType: item.incidentType,
                mitreTechnique: item.mitreTechnique,
                createdAt: item.createdAt
            })),

            ...events.map((item) => ({
                id: item._id,
                type: "EVENT",
                title: item.eventType,
                description: item.description,
                severity: item.severity,
                status: item.status,
                source: item.source,
                sourceIp: item.sourceIp,
                destinationIp: item.destinationIp,
                username: item.username,
                createdAt: item.createdAt
            }))
        ];

        results.sort(
            (a, b) =>
                new Date(b.createdAt) - new Date(a.createdAt)
        );

        res.status(200).json({
            success: true,
            query: search,
            count: results.length,
            results: results.slice(0, 50)
        });

    } catch (error) {
        console.error("Global search error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to perform global search"
        });
    }
};

module.exports = {
    globalSearch
};