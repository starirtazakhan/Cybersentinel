const SecurityEvent = require("../models/SecurityEvent");
const Alert = require("../models/Alert");
const Incident = require("../models/Incident");

// Get threat intelligence derived from existing security data
const getThreatIntelligence = async (req, res) => {
    try {
        const events = await SecurityEvent.find()
            .select(
                "eventType source sourceIp destinationIp username description severity status detectedAt createdAt"
            )
            .sort({ createdAt: -1 });

        const alerts = await Alert.find()
            .select(
                "title alertType severity riskScore status sourceIp username detectedAt createdAt"
            )
            .sort({ createdAt: -1 });

        const incidents = await Incident.find()
            .select(
                "title incidentType mitreTechnique severity status riskScore sourceIp username detectedAt createdAt"
            )
            .sort({ createdAt: -1 });

        // -----------------------------
        // Extract IP intelligence
        // -----------------------------

        const ipMap = new Map();

        const addIp = ({
            ip,
            source,
            type,
            severity,
            description,
            detectedAt
        }) => {
            if (!ip) return;

            if (!ipMap.has(ip)) {
                ipMap.set(ip, {
                    indicator: ip,
                    indicatorType: "IP",
                    occurrences: 0,
                    severities: new Set(),
                    sources: new Set(),
                    relatedActivity: [],
                    lastSeen: detectedAt
                });
            }

            const entry = ipMap.get(ip);

            entry.occurrences += 1;

            if (severity) {
                entry.severities.add(severity);
            }

            if (source) {
                entry.sources.add(source);
            }

            if (
                detectedAt &&
                (!entry.lastSeen ||
                    new Date(detectedAt) > new Date(entry.lastSeen))
            ) {
                entry.lastSeen = detectedAt;
            }

            if (entry.relatedActivity.length < 5) {
                entry.relatedActivity.push({
                    type,
                    severity,
                    description
                });
            }
        };

        // Security event IPs
        events.forEach((event) => {
            addIp({
                ip: event.sourceIp,
                source: event.source,
                type: event.eventType,
                severity: event.severity,
                description: event.description,
                detectedAt: event.detectedAt || event.createdAt
            });

            addIp({
                ip: event.destinationIp,
                source: event.source,
                type: event.eventType,
                severity: event.severity,
                description: event.description,
                detectedAt: event.detectedAt || event.createdAt
            });
        });

        // Alert IPs
        alerts.forEach((alert) => {
            addIp({
                ip: alert.sourceIp,
                source: "ALERT",
                type: alert.alertType,
                severity: alert.severity,
                description: alert.title,
                detectedAt: alert.detectedAt || alert.createdAt
            });
        });

        // Incident IPs
        incidents.forEach((incident) => {
            addIp({
                ip: incident.sourceIp,
                source: "INCIDENT",
                type: incident.incidentType,
                severity: incident.severity,
                description: incident.title,
                detectedAt: incident.detectedAt || incident.createdAt
            });
        });

        // Convert Sets to arrays
        const indicators = Array.from(ipMap.values()).map((item) => ({
            ...item,
            severities: Array.from(item.severities),
            sources: Array.from(item.sources)
        }));

        // Highest activity first
        indicators.sort((a, b) => b.occurrences - a.occurrences);

        // -----------------------------
        // Username intelligence
        // -----------------------------

        const usernameMap = new Map();

        const addUsername = ({
            username,
            type,
            severity,
            sourceIp,
            detectedAt
        }) => {
            if (!username) return;

            if (!usernameMap.has(username)) {
                usernameMap.set(username, {
                    username,
                    occurrences: 0,
                    severities: new Set(),
                    sourceIps: new Set(),
                    lastSeen: detectedAt
                });
            }

            const entry = usernameMap.get(username);

            entry.occurrences += 1;

            if (severity) {
                entry.severities.add(severity);
            }

            if (sourceIp) {
                entry.sourceIps.add(sourceIp);
            }

            if (
                detectedAt &&
                (!entry.lastSeen ||
                    new Date(detectedAt) > new Date(entry.lastSeen))
            ) {
                entry.lastSeen = detectedAt;
            }
        };

        events.forEach((event) => {
            addUsername({
                username: event.username,
                type: event.eventType,
                severity: event.severity,
                sourceIp: event.sourceIp,
                detectedAt: event.detectedAt || event.createdAt
            });
        });

        alerts.forEach((alert) => {
            addUsername({
                username: alert.username,
                type: alert.alertType,
                severity: alert.severity,
                sourceIp: alert.sourceIp,
                detectedAt: alert.detectedAt || alert.createdAt
            });
        });

        incidents.forEach((incident) => {
            addUsername({
                username: incident.username,
                type: incident.incidentType,
                severity: incident.severity,
                sourceIp: incident.sourceIp,
                detectedAt: incident.detectedAt || incident.createdAt
            });
        });

        const usernames = Array.from(usernameMap.values()).map((item) => ({
            ...item,
            severities: Array.from(item.severities),
            sourceIps: Array.from(item.sourceIps)
        }));

        usernames.sort((a, b) => b.occurrences - a.occurrences);

        // -----------------------------
        // Summary
        // -----------------------------

        const criticalIndicators = indicators.filter((indicator) =>
            indicator.severities.includes("CRITICAL")
        ).length;

        const highIndicators = indicators.filter((indicator) =>
            indicator.severities.includes("HIGH")
        ).length;

        const uniqueSourceIps = new Set(
            events
                .map((event) => event.sourceIp)
                .filter(Boolean)
        );

        const uniqueDestinationIps = new Set(
            events
                .map((event) => event.destinationIp)
                .filter(Boolean)
        );

        res.status(200).json({
            success: true,

            summary: {
                totalEvents: events.length,
                totalAlerts: alerts.length,
                totalIncidents: incidents.length,
                uniqueIndicators: indicators.length,
                uniqueSourceIps: uniqueSourceIps.size,
                uniqueDestinationIps: uniqueDestinationIps.size,
                criticalIndicators,
                highIndicators
            },

            indicators,

            usernames,

            recentActivity: [
                ...events.map((event) => ({
                    id: event._id,
                    type: "EVENT",
                    activityType: event.eventType,
                    severity: event.severity,
                    sourceIp: event.sourceIp,
                    destinationIp: event.destinationIp,
                    username: event.username,
                    description: event.description,
                    timestamp: event.detectedAt || event.createdAt
                })),

                ...alerts.map((alert) => ({
                    id: alert._id,
                    type: "ALERT",
                    activityType: alert.alertType,
                    severity: alert.severity,
                    sourceIp: alert.sourceIp,
                    username: alert.username,
                    description: alert.title,
                    timestamp: alert.detectedAt || alert.createdAt
                })),

                ...incidents.map((incident) => ({
                    id: incident._id,
                    type: "INCIDENT",
                    activityType: incident.incidentType,
                    severity: incident.severity,
                    sourceIp: incident.sourceIp,
                    username: incident.username,
                    description: incident.title,
                    timestamp: incident.detectedAt || incident.createdAt
                }))
            ]
                .sort(
                    (a, b) =>
                        new Date(b.timestamp) -
                        new Date(a.timestamp)
                )
                .slice(0, 50)
        });
    } catch (error) {
        console.error(
            "Threat intelligence error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

module.exports = {
    getThreatIntelligence
};