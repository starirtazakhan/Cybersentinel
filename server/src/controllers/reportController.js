const SecurityEvent = require("../models/SecurityEvent");
const Alert = require("../models/Alert");
const Incident = require("../models/Incident");
const { getMitreMapping } = require("../services/mitreService");

const getReport = async (req, res) => {
    try {
        const {
            startDate,
            endDate
        } = req.query;

        const dateFilter = {};

        if (startDate || endDate) {
            dateFilter.createdAt = {};

            if (startDate) {
                dateFilter.createdAt.$gte =
                    new Date(`${startDate}T00:00:00.000Z`);
            }

            if (endDate) {
                dateFilter.createdAt.$lte =
                    new Date(`${endDate}T23:59:59.999Z`);
            }
        }

        const [
            events,
            alerts,
            incidents
        ] = await Promise.all([
            SecurityEvent.find(dateFilter)
                .select(
                    "eventType source sourceIp destinationIp username severity status createdAt detectedAt"
                )
                .sort({ createdAt: -1 }),

            Alert.find(dateFilter)
                .select(
                    "title alertType severity riskScore status sourceIp username createdAt detectedAt"
                )
                .sort({ createdAt: -1 }),

            Incident.find(dateFilter)
                .select(
                    "title incidentType mitreTechnique severity status riskScore sourceIp username createdAt detectedAt"
                )
                .sort({ createdAt: -1 })
        ]);

        // -----------------------------
        // Severity distribution
        // -----------------------------

        const severity = {
            LOW: 0,
            MEDIUM: 0,
            HIGH: 0,
            CRITICAL: 0
        };

        alerts.forEach((alert) => {
            if (severity[alert.severity] !== undefined) {
                severity[alert.severity]++;
            }
        });

        incidents.forEach((incident) => {
            if (
                severity[incident.severity] !==
                undefined
            ) {
                severity[incident.severity]++;
            }
        });

        // -----------------------------
        // Alert status
        // -----------------------------

        const alertStatus = {};

        alerts.forEach((alert) => {
            alertStatus[alert.status] =
                (alertStatus[alert.status] || 0) + 1;
        });

        // -----------------------------
        // Incident status
        // -----------------------------

        const incidentStatus = {};

        incidents.forEach((incident) => {
            incidentStatus[incident.status] =
                (incidentStatus[incident.status] || 0) +
                1;
        });

        // -----------------------------
        // Risk distribution
        // -----------------------------

        const risk = {
            LOW: 0,
            MEDIUM: 0,
            HIGH: 0,
            CRITICAL: 0
        };

        incidents.forEach((incident) => {
            if (
                incident.riskLevel &&
                risk[incident.riskLevel] !== undefined
            ) {
                risk[incident.riskLevel]++;
            } else if (incident.riskScore != null) {
                if (incident.riskScore >= 80) {
                    risk.CRITICAL++;
                } else if (incident.riskScore >= 60) {
                    risk.HIGH++;
                } else if (incident.riskScore >= 30) {
                    risk.MEDIUM++;
                } else {
                    risk.LOW++;
                }
            }
        });

        // -----------------------------
        // MITRE coverage
        // -----------------------------

        const mitreMap = new Map();

        incidents.forEach((incident) => {
            let technique =
                incident.mitreTechnique;

            if (!technique?.id) {
                technique = getMitreMapping(
                    incident.incidentType
                );
            }

            if (!technique?.id) return;

            if (!mitreMap.has(technique.id)) {
                mitreMap.set(technique.id, {
                    id: technique.id,
                    name: technique.name,
                    tactic: technique.tactic,
                    occurrences: 0
                });
            }

            mitreMap.get(
                technique.id
            ).occurrences++;
        });

        alerts.forEach((alert) => {
            const technique =
                getMitreMapping(alert.alertType);

            if (!technique?.id) return;

            if (!mitreMap.has(technique.id)) {
                mitreMap.set(technique.id, {
                    id: technique.id,
                    name: technique.name,
                    tactic: technique.tactic,
                    occurrences: 0
                });
            }

            mitreMap.get(
                technique.id
            ).occurrences++;
        });

        const mitreCoverage = Array.from(
            mitreMap.values()
        ).sort(
            (a, b) =>
                b.occurrences - a.occurrences
        );

        // -----------------------------
        // Top source IPs
        // -----------------------------

        const ipMap = new Map();

        const addIp = (ip, severityValue) => {
            if (!ip) return;

            if (!ipMap.has(ip)) {
                ipMap.set(ip, {
                    ip,
                    occurrences: 0,
                    highestSeverity: "LOW"
                });
            }

            const entry = ipMap.get(ip);

            entry.occurrences++;

            const rank = {
                LOW: 1,
                MEDIUM: 2,
                HIGH: 3,
                CRITICAL: 4
            };

            if (
                rank[severityValue] >
                rank[entry.highestSeverity]
            ) {
                entry.highestSeverity =
                    severityValue;
            }
        };

        events.forEach((event) => {
            addIp(
                event.sourceIp,
                event.severity
            );
        });

        alerts.forEach((alert) => {
            addIp(
                alert.sourceIp,
                alert.severity
            );
        });

        incidents.forEach((incident) => {
            addIp(
                incident.sourceIp,
                incident.severity
            );
        });

        const topSourceIps = Array.from(
            ipMap.values()
        )
            .sort(
                (a, b) =>
                    b.occurrences -
                    a.occurrences
            )
            .slice(0, 10);

        // -----------------------------
        // Average risk
        // -----------------------------

        const averageRisk =
            incidents.length > 0
                ? Math.round(
                      incidents.reduce(
                          (sum, incident) =>
                              sum +
                              (incident.riskScore || 0),
                          0
                      ) / incidents.length
                  )
                : 0;

        // -----------------------------
        // Recent activity
        // -----------------------------

        const recentActivity = [
            ...events.map((event) => ({
                type: "EVENT",
                name: event.eventType,
                severity: event.severity,
                sourceIp: event.sourceIp,
                timestamp:
                    event.detectedAt ||
                    event.createdAt
            })),

            ...alerts.map((alert) => ({
                type: "ALERT",
                name: alert.title,
                severity: alert.severity,
                sourceIp: alert.sourceIp,
                timestamp:
                    alert.detectedAt ||
                    alert.createdAt
            })),

            ...incidents.map((incident) => ({
                type: "INCIDENT",
                name: incident.title,
                severity: incident.severity,
                sourceIp: incident.sourceIp,
                timestamp:
                    incident.detectedAt ||
                    incident.createdAt
            }))
        ]
            .sort(
                (a, b) =>
                    new Date(b.timestamp) -
                    new Date(a.timestamp)
            )
            .slice(0, 15);

        res.status(200).json({
            success: true,

            period: {
                startDate: startDate || null,
                endDate: endDate || null
            },

            summary: {
                totalEvents: events.length,
                totalAlerts: alerts.length,
                totalIncidents: incidents.length,
                averageIncidentRisk: averageRisk,
                criticalAlerts: alerts.filter(
                    (alert) =>
                        alert.severity === "CRITICAL"
                ).length,
                highAlerts: alerts.filter(
                    (alert) =>
                        alert.severity === "HIGH"
                ).length,
                openAlerts: alerts.filter(
                    (alert) =>
                        alert.status === "OPEN"
                ).length,
                openIncidents: incidents.filter(
                    (incident) =>
                        [
                            "OPEN",
                            "INVESTIGATING",
                            "CONTAINED"
                        ].includes(incident.status)
                ).length
            },

            severity,
            alertStatus,
            incidentStatus,
            risk,
            mitreCoverage,
            topSourceIps,
            recentActivity
        });
    } catch (error) {
        console.error(
            "Report generation error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

module.exports = {
    getReport
};