const Incident = require("../models/Incident");
const Alert = require("../models/Alert");

const { getMitreMapping } = require("../services/mitreService");
const { createAuditLog } = require("../services/auditService");
const { calculateRiskScore } = require("../services/riskService");


// ======================================================
// CREATE INCIDENT FROM ALERT
// ======================================================

const createIncidentFromAlert = async (req, res) => {
    try {
        const { alertId } = req.body;

        if (!alertId) {
            return res.status(400).json({
                success: false,
                message: "alertId is required"
            });
        }

        const alert = await Alert.findById(alertId);

        if (!alert) {
            return res.status(404).json({
                success: false,
                message: "Alert not found"
            });
        }

        // Prevent duplicate active incidents
        const existingIncident = await Incident.findOne({
            relatedAlerts: alert._id,
            status: {
                $nin: ["RESOLVED", "CLOSED"]
            }
        });

        if (existingIncident) {
            return res.status(409).json({
                success: false,
                message: "An active incident already exists for this alert",
                incident: existingIncident
            });
        }

        // ==================================================
        // MITRE ATT&CK MAPPING
        // ==================================================

        const mitreTechnique = getMitreMapping(alert.alertType);

        // ==================================================
        // DYNAMIC RISK CALCULATION
        // ==================================================

        const risk = calculateRiskScore({
            severity: alert.severity,
            eventCount: alert.relatedEvents?.length || 1,
            isRepeated: true,
            mitreTechnique
        });

        console.log("========== RISK CALCULATION ==========");
        console.log("Alert severity:", alert.severity);
        console.log("Event count:", alert.relatedEvents?.length || 1);
        console.log("MITRE technique:", mitreTechnique);
        console.log("Risk score:", risk.score);
        console.log("Risk level:", risk.riskLevel);
        console.log("======================================");

        // ==================================================
        // CREATE INCIDENT
        // ==================================================

        const incident = await Incident.create({
            title: alert.title,
            description: alert.description,
            incidentType: alert.alertType,

            severity: alert.severity,

            // Dynamic risk information
            riskScore: risk.score,
            riskLevel: risk.riskLevel,

            // MITRE ATT&CK
            mitreTechnique,

            sourceIp: alert.sourceIp,
            username: alert.username,

            relatedAlerts: [alert._id],
            relatedEvents: alert.relatedEvents,

            createdBy: req.user.userId
        });

        // ==================================================
        // UPDATE ALERT STATUS
        // ==================================================

        alert.status = "INVESTIGATING";
        await alert.save();

        // ==================================================
        // AUDIT LOG
        // ==================================================

        await createAuditLog({
            action: "CREATE_INCIDENT",
            resourceType: "INCIDENT",
            resourceId: incident._id,
            performedBy: req.user.userId,
            details: `Incident created from alert ${alert._id}`,
            ipAddress: req.ip
        });

        // ==================================================
        // RESPONSE
        // ==================================================

        res.status(201).json({
            success: true,
            message: "Incident created successfully",
            incident
        });

    } catch (error) {
        console.error("Create incident error:", error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


// ======================================================
// GET ALL INCIDENTS
// ======================================================

const getIncidents = async (req, res) => {
    try {
        const incidents = await Incident.find()
            .populate("createdBy", "name email role")
            .populate("assignedTo", "name email role")
            .populate("relatedAlerts")
            .populate("relatedEvents")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: incidents.length,
            incidents
        });

    } catch (error) {
        console.error("Get incidents error:", error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


// ======================================================
// GET SINGLE INCIDENT
// ======================================================

const getIncidentById = async (req, res) => {
    try {
        const incident = await Incident.findById(req.params.id)
            .populate("createdBy", "name email role")
            .populate("assignedTo", "name email role")
            .populate("relatedAlerts")
            .populate("relatedEvents")
            .populate("investigationNotes.addedBy", "name email role");

        if (!incident) {
            return res.status(404).json({
                success: false,
                message: "Incident not found"
            });
        }

        res.status(200).json({
            success: true,
            incident
        });

    } catch (error) {
        console.error("Get incident error:", error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


// ======================================================
// UPDATE INCIDENT STATUS
// ======================================================

const updateIncidentStatus = async (req, res) => {
    try {
        const { status } = req.body;

        const allowedStatuses = [
            "OPEN",
            "INVESTIGATING",
            "CONTAINED",
            "RESOLVED",
            "CLOSED"
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid incident status"
            });
        }

        const incident = await Incident.findById(req.params.id);

        if (!incident) {
            return res.status(404).json({
                success: false,
                message: "Incident not found"
            });
        }

        const oldStatus = incident.status;

        // Update status ONCE
        incident.status = status;

        // Record resolution time
        if (status === "RESOLVED" || status === "CLOSED") {
            incident.resolvedAt = new Date();
        }

        await incident.save();

        // Audit status change
        await createAuditLog({
            action: "UPDATE_INCIDENT_STATUS",
            resourceType: "INCIDENT",
            resourceId: incident._id,
            performedBy: req.user.userId,
            details: `Incident status changed from ${oldStatus} to ${status}`,
            ipAddress: req.ip
        });

        res.status(200).json({
            success: true,
            message: "Incident status updated successfully",
            incident
        });

    } catch (error) {
        console.error("Update incident status error:", error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


// ======================================================
// ADD INVESTIGATION NOTE
// ======================================================

const addInvestigationNote = async (req, res) => {
    try {
        const { note } = req.body;

        if (!note || !note.trim()) {
            return res.status(400).json({
                success: false,
                message: "Investigation note is required"
            });
        }

        const incident = await Incident.findById(req.params.id);

        if (!incident) {
            return res.status(404).json({
                success: false,
                message: "Incident not found"
            });
        }

        incident.investigationNotes.push({
            note: note.trim(),
            addedBy: req.user.userId,
            addedAt: new Date()
        });

        await incident.save();

        // Audit investigation note
        await createAuditLog({
            action: "ADD_INVESTIGATION_NOTE",
            resourceType: "INCIDENT",
            resourceId: incident._id,
            performedBy: req.user.userId,
            details: "Investigation note added",
            ipAddress: req.ip
        });

        res.status(200).json({
            success: true,
            message: "Investigation note added successfully",
            incident
        });

    } catch (error) {
        console.error("Add investigation note error:", error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};


// ======================================================
// EXPORT CONTROLLERS
// ======================================================

module.exports = {
    createIncidentFromAlert,
    getIncidents,
    getIncidentById,
    updateIncidentStatus,
    addInvestigationNote
};