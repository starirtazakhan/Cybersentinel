const Incident = require("../models/Incident");
const Alert = require("../models/Alert");
const { getMitreMapping } = require("../services/mitreService");

// Get MITRE ATT&CK intelligence from actual alerts and incidents
const getMitreOverview = async (req, res) => {
    try {
        const incidents = await Incident.find()
            .select(
                "title incidentType mitreTechnique severity status riskScore sourceIp detectedAt createdAt"
            )
            .sort({ createdAt: -1 });

        const alerts = await Alert.find()
            .select(
                "title alertType severity riskScore status sourceIp detectedAt createdAt"
            )
            .sort({ createdAt: -1 });

        const techniqueMap = new Map();

        const ensureTechnique = (technique) => {
            if (!technique || !technique.id) {
                return null;
            }

            if (!techniqueMap.has(technique.id)) {
                techniqueMap.set(technique.id, {
                    id: technique.id,
                    name: technique.name || "Unknown Technique",
                    tactic: technique.tactic || "Unknown",
                    alertCount: 0,
                    incidentCount: 0,
                    totalOccurrences: 0,
                    highestSeverity: "LOW",
                    totalRiskScore: 0,
                    relatedAlerts: [],
                    relatedIncidents: []
                });
            }

            return techniqueMap.get(technique.id);
        };

        const severityRank = {
            LOW: 1,
            MEDIUM: 2,
            HIGH: 3,
            CRITICAL: 4
        };

        // -----------------------------
        // Process incidents
        // -----------------------------

        incidents.forEach((incident) => {
            let technique = incident.mitreTechnique;

            // If an incident doesn't contain a saved MITRE
            // mapping, derive it from the incident type.
            if (!technique?.id) {
                technique = getMitreMapping(
                    incident.incidentType
                );
            }

            const entry = ensureTechnique(technique);

            if (!entry) return;

            entry.incidentCount += 1;
            entry.totalOccurrences += 1;
            entry.totalRiskScore += incident.riskScore || 0;

            if (
                severityRank[incident.severity] >
                severityRank[entry.highestSeverity]
            ) {
                entry.highestSeverity = incident.severity;
            }

            if (entry.relatedIncidents.length < 10) {
                entry.relatedIncidents.push({
                    id: incident._id,
                    title: incident.title,
                    severity: incident.severity,
                    status: incident.status,
                    riskScore: incident.riskScore,
                    sourceIp: incident.sourceIp,
                    detectedAt:
                        incident.detectedAt ||
                        incident.createdAt
                });
            }
        });

        // -----------------------------
        // Process alerts
        // -----------------------------

        alerts.forEach((alert) => {
            const technique = getMitreMapping(
                alert.alertType
            );

            const entry = ensureTechnique(technique);

            if (!entry) return;

            entry.alertCount += 1;
            entry.totalOccurrences += 1;
            entry.totalRiskScore += alert.riskScore || 0;

            if (
                severityRank[alert.severity] >
                severityRank[entry.highestSeverity]
            ) {
                entry.highestSeverity = alert.severity;
            }

            if (entry.relatedAlerts.length < 10) {
                entry.relatedAlerts.push({
                    id: alert._id,
                    title: alert.title,
                    severity: alert.severity,
                    status: alert.status,
                    riskScore: alert.riskScore,
                    sourceIp: alert.sourceIp,
                    detectedAt:
                        alert.detectedAt ||
                        alert.createdAt
                });
            }
        });

        const techniques = Array.from(
            techniqueMap.values()
        )
            .map((technique) => ({
                ...technique,
                averageRiskScore:
                    technique.totalOccurrences > 0
                        ? Math.round(
                              technique.totalRiskScore /
                                  technique.totalOccurrences
                          )
                        : 0
            }))
            .sort(
                (a, b) =>
                    b.totalOccurrences -
                    a.totalOccurrences
            );

        // -----------------------------
        // Tactic distribution
        // -----------------------------

        const tacticMap = new Map();

        techniques.forEach((technique) => {
            if (!tacticMap.has(technique.tactic)) {
                tacticMap.set(technique.tactic, {
                    tactic: technique.tactic,
                    occurrences: 0,
                    techniques: 0
                });
            }

            const tactic = tacticMap.get(
                technique.tactic
            );

            tactic.occurrences +=
                technique.totalOccurrences;

            tactic.techniques += 1;
        });

        const tactics = Array.from(
            tacticMap.values()
        ).sort(
            (a, b) =>
                b.occurrences - a.occurrences
        );

        // -----------------------------
        // Summary
        // -----------------------------

        const criticalCount = techniques.filter(
            (technique) =>
                technique.highestSeverity === "CRITICAL"
        ).length;

        const highCount = techniques.filter(
            (technique) =>
                technique.highestSeverity === "HIGH"
        ).length;

        const totalMappedActivity =
            techniques.reduce(
                (total, technique) =>
                    total +
                    technique.totalOccurrences,
                0
            );

        res.status(200).json({
            success: true,

            summary: {
                techniquesObserved: techniques.length,
                tacticsObserved: tactics.length,
                totalMappedActivity,
                criticalTechniques: criticalCount,
                highTechniques: highCount,
                totalAlerts: alerts.length,
                totalIncidents: incidents.length
            },

            techniques,

            tactics
        });
    } catch (error) {
        console.error(
            "MITRE overview error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

module.exports = {
    getMitreOverview
};