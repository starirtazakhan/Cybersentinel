const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
    {
        action: {
            type: String,
            required: true,
            trim: true
        },

        resourceType: {
            type: String,
            required: true,
            trim: true
        },

        resourceId: {
            type: mongoose.Schema.Types.ObjectId
        },

        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        details: {
            type: String,
            trim: true
        },

        ipAddress: {
            type: String,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);