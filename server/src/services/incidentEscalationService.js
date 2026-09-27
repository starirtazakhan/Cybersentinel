const Incident = require("../models/Incident");

/**
 * Automatically escalates a CRITICAL alert into an incident.
 *
 * Non-critical alerts remain available for analyst review.
 *
 * Duplicate incidents are prevented by checking whether
 * the alert is already associated with an incident.
 */
const autoEscalateCriticalAlert = async (alert) => {
    try {
        if (!alert) {
            return {
                escalated: false,
                incident: null
            };
        }

        // Only CRITICAL alerts are automatically escalated.
        if (alert.severity !== "CRITICAL") {
            return {
                escalated: false,
                incident: null
            };
        }

        // Prevent duplicate incidents for the same alert.
        const existingIncident = await Incident.findOne({
            relatedAlerts: alert._id
        });

        if (existingIncident) {
            return {
                escalated: false,
                incident: existingIncident
            };
        }

        // Determine risk level from the alert's risk score.
        let riskLevel = "LOW";

        if (alert.riskScore >= 80) {
            riskLevel = "CRITICAL";
        } else if (alert.riskScore >= 60) {
            riskLevel = "HIGH";
        } else if (alert.riskScore >= 30) {
            riskLevel = "MEDIUM";
        }

        /*
         * Map the alert type directly to the incident type.
         *
         * Alert and Incident enums now support PHISHING,
         * so phishing alerts can also be automatically escalated.
         */
        const incidentType = [
            "BRUTE_FORCE",
            "PHISHING",
            "MALWARE",
            "PORT_SCAN",
            "PRIVILEGE_ESCALATION"
        ].includes(alert.alertType)
            ? alert.alertType
            : "OTHER";

        const incident = await Incident.create({
            title: `Critical Alert: ${alert.title}`,

            description:
                `Automatically escalated from critical alert. ${alert.description}`,

            incidentType,

            severity: alert.severity,

            riskScore: alert.riskScore,

            riskLevel,

            sourceIp: alert.sourceIp,

            username: alert.username,

            relatedAlerts: [alert._id],

            relatedEvents: alert.relatedEvents || [],

            createdBy: alert.createdBy,

            detectedAt: alert.detectedAt || new Date()
        });

        console.log(
            `AUTO-ESCALATION: Alert ${alert._id} -> Incident ${incident._id}`
        );

        return {
            escalated: true,
            incident
        };

    } catch (error) {
        console.error(
            "Automatic incident escalation failed:",
            error.message
        );

        throw error;
    }
};

module.exports = {
    autoEscalateCriticalAlert
};