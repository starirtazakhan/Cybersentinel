const AuditLog = require("../models/AuditLog");

const createAuditLog = async ({
    action,
    resourceType,
    resourceId,
    performedBy,
    details,
    ipAddress
}) => {
    try {
        await AuditLog.create({
            action,
            resourceType,
            resourceId,
            performedBy,
            details,
            ipAddress
        });

        console.log("Audit log created:", action);

    } catch (error) {
        console.error("Audit log error:", error);
    }
};

module.exports = {
    createAuditLog
};