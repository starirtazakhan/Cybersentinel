const SecurityEvent = require("../models/SecurityEvent");
const Alert = require("../models/Alert");
const {
    autoEscalateCriticalAlert
} = require("./incidentEscalationService");


// ======================================================
// BRUTE FORCE
// ======================================================

const detectBruteForce = async (event) => {
    try {
        if (event.eventType !== "LOGIN_FAILURE") {
            return null;
        }

        if (!event.sourceIp) {
            return null;
        }

        const timeWindow = new Date(
            Date.now() - 5 * 60 * 1000
        );

        const relatedEvents = await SecurityEvent.find({
            eventType: "LOGIN_FAILURE",
            sourceIp: event.sourceIp,
            detectedAt: {
                $gte: timeWindow
            }
        }).sort({
            detectedAt: 1
        });

        const threshold = 5;

        if (relatedEvents.length < threshold) {
            return null;
        }

        const existingAlert = await Alert.findOne({
            alertType: "BRUTE_FORCE",
            sourceIp: event.sourceIp,
            status: {
                $in: ["OPEN", "INVESTIGATING"]
            }
        });

        if (existingAlert) {
            return existingAlert;
        }

        let riskScore = 70;

        if (relatedEvents.length >= 10) {
            riskScore = 90;
        }

        if (relatedEvents.length >= 20) {
            riskScore = 100;
        }

        let severity = "HIGH";

        if (riskScore >= 90) {
            severity = "CRITICAL";
        }

        const alert = await Alert.create({
            title: "Possible Brute Force Attack",

            description:
                `${relatedEvents.length} failed login attempts detected from ${event.sourceIp} within 5 minutes.`,

            alertType: "BRUTE_FORCE",

            severity,

            riskScore,

            sourceIp: event.sourceIp,

            username: event.username,

            relatedEvents:
                relatedEvents.map(
                    (item) => item._id
                ),

            createdBy: event.createdBy,

            detectedAt: new Date()
        });

        return alert;

    } catch (error) {
        console.error(
            "Brute force detection error:",
            error
        );

        throw error;
    }
};


// ======================================================
// PHISHING
// ======================================================

const detectPhishingAttempt = async (event) => {
    try {
        if (event.eventType !== "PHISHING_EMAIL") {
            return null;
        }

        const existingAlert = await Alert.findOne({
            alertType: "PHISHING",
            username: event.username,
            status: {
                $in: ["OPEN", "INVESTIGATING"]
            }
        });

        if (existingAlert) {
            return existingAlert;
        }

        const clicked =
            Boolean(
                event.metadata?.linkClicked
            );

        const severity =
            clicked
                ? "CRITICAL"
                : "MEDIUM";

        const riskScore =
            clicked
                ? 95
                : 55;

        const alert = await Alert.create({
            title: clicked
                ? "Phishing Link Clicked"
                : "Phishing Email Detected",

            description:
                event.description ||
                `Phishing email detected targeting ${event.username || "an unknown user"}.`,

            alertType: "PHISHING",

            severity,

            riskScore,

            sourceIp: event.sourceIp,

            username: event.username,

            relatedEvents: [
                event._id
            ],

            createdBy: event.createdBy,

            detectedAt: new Date()
        });

        return alert;

    } catch (error) {
        console.error(
            "Phishing detection error:",
            error
        );

        throw error;
    }
};


// ======================================================
// AUTHENTICATION ANOMALY
// ======================================================

const detectAuthAnomaly = async (event) => {
    try {
        if (event.eventType !== "AUTH_ANOMALY") {
            return null;
        }

        const existingAlert = await Alert.findOne({
            alertType: "SUSPICIOUS_LOGIN",

            sourceIp: event.sourceIp,

            username: event.username,

            status: {
                $in: ["OPEN", "INVESTIGATING"]
            }
        });

        if (existingAlert) {
            return existingAlert;
        }

        const alert = await Alert.create({
            title: "Suspicious Login Detected",

            description:
                event.description ||
                `Unusual login pattern detected for ${event.username || "an unknown user"} from ${event.sourceIp || "an unknown IP"}.`,

            alertType: "SUSPICIOUS_LOGIN",

            severity: "MEDIUM",

            riskScore: 50,

            sourceIp: event.sourceIp,

            username: event.username,

            relatedEvents: [
                event._id
            ],

            createdBy: event.createdBy,

            detectedAt: new Date()
        });

        return alert;

    } catch (error) {
        console.error(
            "Auth anomaly detection error:",
            error
        );

        throw error;
    }
};


// ======================================================
// PORT SCAN
// ======================================================

const detectPortScanActivity = async (event) => {
    try {
        if (event.eventType !== "PORT_SCAN") {
            return null;
        }

        const existingAlert = await Alert.findOne({
            alertType: "PORT_SCAN",

            sourceIp: event.sourceIp,

            status: {
                $in: ["OPEN", "INVESTIGATING"]
            }
        });

        if (existingAlert) {
            return existingAlert;
        }

        const portsScanned =
            event.metadata?.portsScanned || [];

        const riskScore =
            portsScanned.length >= 10
                ? 80
                : 60;

        const severity =
            riskScore >= 80
                ? "HIGH"
                : "MEDIUM";

        const alert = await Alert.create({
            title: "Port Scan Detected",

            description:
                event.description ||
                `Port scanning activity detected from ${event.sourceIp || "an unknown IP"}.`,

            alertType: "PORT_SCAN",

            severity,

            riskScore,

            sourceIp: event.sourceIp,

            username: event.username,

            relatedEvents: [
                event._id
            ],

            createdBy: event.createdBy,

            detectedAt: new Date()
        });

        return alert;

    } catch (error) {
        console.error(
            "Port scan detection error:",
            error
        );

        throw error;
    }
};


// ======================================================
// MALWARE
// ======================================================

const detectMalwareActivity = async (event) => {
    try {
        if (event.eventType !== "MALWARE_DETECTED") {
            return null;
        }

        const existingAlert = await Alert.findOne({
            alertType: "MALWARE",

            sourceIp: event.sourceIp,

            status: {
                $in: ["OPEN", "INVESTIGATING"]
            }
        });

        if (existingAlert) {
            return existingAlert;
        }

        const alert = await Alert.create({
            title: "Malware Detected",

            description:
                event.description ||
                `Malware activity detected on host associated with ${event.sourceIp || "an unknown IP"}.`,

            alertType: "MALWARE",

            severity: "CRITICAL",

            riskScore: 95,

            sourceIp: event.sourceIp,

            username: event.username,

            relatedEvents: [
                event._id
            ],

            createdBy: event.createdBy,

            detectedAt: new Date()
        });

        return alert;

    } catch (error) {
        console.error(
            "Malware detection error:",
            error
        );

        throw error;
    }
};


// ======================================================
// PRIVILEGE ESCALATION
// ======================================================

const detectPrivilegeEscalation = async (event) => {
    try {
        if (
            event.eventType !==
            "PRIVILEGE_ESCALATION_ATTEMPT"
        ) {
            return null;
        }

        const existingAlert = await Alert.findOne({
            alertType: "PRIVILEGE_ESCALATION",

            username: event.username,

            status: {
                $in: ["OPEN", "INVESTIGATING"]
            }
        });

        if (existingAlert) {
            return existingAlert;
        }

        const alert = await Alert.create({
            title: "Privilege Escalation Attempt",

            description:
                event.description ||
                `Privilege escalation attempt detected for ${event.username || "an unknown user"}.`,

            alertType: "PRIVILEGE_ESCALATION",

            severity: "HIGH",

            riskScore: 85,

            sourceIp: event.sourceIp,

            username: event.username,

            relatedEvents: [
                event._id
            ],

            createdBy: event.createdBy,

            detectedAt: new Date()
        });

        return alert;

    } catch (error) {
        console.error(
            "Privilege escalation detection error:",
            error
        );

        throw error;
    }
};


// ======================================================
// COMBINED DETECTION + AUTO ESCALATION
// ======================================================

const runAllDetections = async (event) => {

    const detectors = [
        detectBruteForce,
        detectPhishingAttempt,
        detectAuthAnomaly,
        detectPortScanActivity,
        detectMalwareActivity,
        detectPrivilegeEscalation
    ];

    for (const detector of detectors) {

        const alert =
            await detector(event);

        if (!alert) {
            continue;
        }

        /*
         * Critical alerts are automatically
         * escalated into incidents.
         */
        const escalation =
            await autoEscalateCriticalAlert(
                alert
            );

        return {
            alert,
            incident:
                escalation.incident,
            autoEscalated:
                escalation.escalated
        };
    }

    return {
        alert: null,
        incident: null,
        autoEscalated: false
    };
};


module.exports = {
    detectBruteForce,
    detectPhishingAttempt,
    detectAuthAnomaly,
    detectPortScanActivity,
    detectMalwareActivity,
    detectPrivilegeEscalation,
    runAllDetections
}; 