const express = require("express");

const authenticate = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

const {
    createIncidentFromAlert,
    getIncidents,
    getIncidentById,
    updateIncidentStatus,
    addInvestigationNote
} = require("../controllers/incidentController");

const router = express.Router();

// Create incident from alert
router.post(
    "/",
    authenticate,
    authorize("ADMIN", "ANALYST"),
    createIncidentFromAlert
);

// Get all incidents
router.get(
    "/",
    authenticate,
    authorize("ADMIN", "ANALYST", "VIEWER"),
    getIncidents
);

// Get single incident
router.get(
    "/:id",
    authenticate,
    authorize("ADMIN", "ANALYST", "VIEWER"),
    getIncidentById
);

// Update incident status
router.patch(
    "/:id/status",
    authenticate,
    authorize("ADMIN", "ANALYST"),
    updateIncidentStatus
);

// Add investigation note
router.post(
    "/:id/notes",
    authenticate,
    authorize("ADMIN", "ANALYST"),
    addInvestigationNote
);

module.exports = router;