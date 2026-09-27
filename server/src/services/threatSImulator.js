const SecurityEvent = require("../models/SecurityEvent");
const { runAllDetections } = require("./detectionService");
const { getSystemUserId } = require("./systemUser");

// A mix of recurring attacker IPs (so the same source shows up
// repeatedly, like a real campaign) and random benign IPs.
const ATTACKER_IPS = [
    "185.220.101.7",
    "45.155.204.63",
    "103.87.169.24",
    "194.61.24.102"
];

const BENIGN_IPS = [
    "8.8.8.8",
    "8.8.4.4",
    "1.1.1.1",
    "208.67.222.222",
    "9.9.9.9"
];

const INTERNAL_HOSTS = [
    "10.0.0.5",
    "10.0.0.12",
    "10.0.1.20",
    "10.0.1.35"
];

const USERNAMES = [
    "j.smith",
    "a.khan",
    "m.patel",
    "r.johnson",
    "s.ahmed",
    "l.garcia"
];

const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const randomSourceIp = () =>
    Math.random() < 0.4
        ? randomFrom(ATTACKER_IPS)
        : randomFrom(BENIGN_IPS);


// ======================================================
// SINGLE RANDOM EVENT
// ======================================================

const generateRandomEvent = async (systemUserId) => {
    const roll = Math.random();

    let eventType;

    if (roll < 0.35) {
        eventType = "LOGIN_FAILURE";
    } else if (roll < 0.5) {
        eventType = "AUTH_ANOMALY";
    } else if (roll < 0.65) {
        eventType = "PHISHING_EMAIL";
    } else if (roll < 0.8) {
        eventType = "PORT_SCAN";
    } else if (roll < 0.92) {
        eventType = "MALWARE_DETECTED";
    } else {
        eventType = "PRIVILEGE_ESCALATION_ATTEMPT";
    }

    const sourceIp = randomSourceIp();
    const username = randomFrom(USERNAMES);
    const destinationIp = randomFrom(INTERNAL_HOSTS);

    let description = "";
    let severity = "LOW";
    let metadata = {};

    switch (eventType) {
        case "LOGIN_FAILURE":
            description = `Failed login attempt for user "${username}" from ${sourceIp}.`;
            severity = "LOW";
            break;

        case "AUTH_ANOMALY":
            description = `Login for "${username}" from an unrecognized location (${sourceIp}).`;
            severity = "MEDIUM";
            break;

        case "PHISHING_EMAIL": {
            const linkClicked = Math.random() < 0.3;

            metadata = {
                linkClicked
            };

            description = linkClicked
                ? `Phishing email delivered to ${username} — link was clicked.`
                : `Phishing email delivered to ${username}.`;

            severity = linkClicked ? "HIGH" : "MEDIUM";
            break;
        }

        case "PORT_SCAN": {
            const portsScanned = Array.from(
                { length: 5 + Math.floor(Math.random() * 15) },
                () => 1000 + Math.floor(Math.random() * 9000)
            );

            metadata = {
                portsScanned
            };

            description = `Port scan detected from ${sourceIp} targeting ${destinationIp}.`;
            severity = "MEDIUM";
            break;
        }

        case "MALWARE_DETECTED":
            description = `Malware signature detected on host ${destinationIp} (source ${sourceIp}).`;
            severity = "CRITICAL";
            break;

        case "PRIVILEGE_ESCALATION_ATTEMPT":
            description = `User "${username}" attempted to escalate privileges on ${destinationIp}.`;
            severity = "HIGH";
            break;

        default:
            description = "Security event detected.";
            severity = "LOW";
    }

    // --------------------------------------------------
    // CREATE SECURITY EVENT
    // --------------------------------------------------

    const event = await SecurityEvent.create({
        eventType,
        source: "threat-simulator",
        sourceIp,
        destinationIp,
        username,
        description,
        severity,
        metadata,
        createdBy: systemUserId
    });

    // --------------------------------------------------
    // RUN ALL DETECTIONS
    // --------------------------------------------------

    const detectionResult = await runAllDetections(event);

    // --------------------------------------------------
    // HANDLE ALERT
    // --------------------------------------------------

    if (detectionResult?.alert) {
        const alert = detectionResult.alert;

        console.log(
            `[Simulator] Alert generated: ${alert.title} (${alert.alertType})`
        );

        // --------------------------------------------------
        // HANDLE AUTOMATIC INCIDENT ESCALATION
        // --------------------------------------------------

        if (detectionResult.autoEscalated && detectionResult.incident) {
            console.log(
                `[Simulator] Auto-escalated CRITICAL alert to incident: ${detectionResult.incident._id}`
            );
        }
    }
};


// ======================================================
// GUARANTEED BRUTE-FORCE BURST
// ======================================================

const generateBruteForceBurst = async (systemUserId) => {
    const sourceIp = randomFrom(ATTACKER_IPS);
    const username = randomFrom(USERNAMES);

    const count = 5 + Math.floor(Math.random() * 5); // 5–9 attempts

    let lastDetectionResult = null;

    for (let i = 0; i < count; i++) {
        const event = await SecurityEvent.create({
            eventType: "LOGIN_FAILURE",
            source: "threat-simulator",
            sourceIp,
            destinationIp: randomFrom(INTERNAL_HOSTS),
            username,
            description: `Failed login attempt for user "${username}" from ${sourceIp}.`,
            severity: "LOW",
            metadata: {},
            createdBy: systemUserId
        });

        lastDetectionResult = await runAllDetections(event);
    }

    // --------------------------------------------------
    // HANDLE BRUTE-FORCE ALERT
    // --------------------------------------------------

    if (lastDetectionResult?.alert) {
        const alert = lastDetectionResult.alert;

        console.log(
            `[Simulator] Brute-force burst: ${count} failed logins from ${sourceIp} -> ${alert.title} (${alert.alertType})`
        );

        // --------------------------------------------------
        // HANDLE AUTOMATIC INCIDENT ESCALATION
        // --------------------------------------------------

        if (
            lastDetectionResult.autoEscalated &&
            lastDetectionResult.incident
        ) {
            console.log(
                `[Simulator] Brute-force alert auto-escalated to incident: ${lastDetectionResult.incident._id}`
            );
        }
    }
};


// ======================================================
// START / STOP
// ======================================================

let eventIntervalHandle = null;
let burstIntervalHandle = null;


// ======================================================
// START THREAT SIMULATOR
// ======================================================

const startThreatSimulator = async () => {
    if (process.env.ENABLE_THREAT_SIMULATOR !== "true") {
        console.log(
            "Threat simulator disabled (set ENABLE_THREAT_SIMULATOR=true in .env to enable)."
        );

        return;
    }

    const systemUserId = await getSystemUserId();

    const eventIntervalMs =
        Number(process.env.SIMULATOR_INTERVAL_MS) || 15000;

    const burstIntervalMs =
        Number(process.env.SIMULATOR_BURST_INTERVAL_MS) || 120000;

    // --------------------------------------------------
    // RANDOM EVENT LOOP
    // --------------------------------------------------

    eventIntervalHandle = setInterval(() => {
        generateRandomEvent(systemUserId).catch((error) =>
            console.error(
                "Threat simulator event error:",
                error
            )
        );
    }, eventIntervalMs);

    // --------------------------------------------------
    // BRUTE-FORCE BURST LOOP
    // --------------------------------------------------

    burstIntervalHandle = setInterval(() => {
        generateBruteForceBurst(systemUserId).catch((error) =>
            console.error(
                "Threat simulator burst error:",
                error
            )
        );
    }, burstIntervalMs);

    console.log(
        `Threat simulator started (random event every ${
            eventIntervalMs / 1000
        }s, brute-force burst every ${
            burstIntervalMs / 1000
        }s).`
    );
};


// ======================================================
// STOP THREAT SIMULATOR
// ======================================================

const stopThreatSimulator = () => {
    if (eventIntervalHandle) {
        clearInterval(eventIntervalHandle);
        eventIntervalHandle = null;
    }

    if (burstIntervalHandle) {
        clearInterval(burstIntervalHandle);
        burstIntervalHandle = null;
    }

    console.log("Threat simulator stopped.");
};


// ======================================================
// EXPORTS
// ======================================================

module.exports = {
    startThreatSimulator,
    stopThreatSimulator
};