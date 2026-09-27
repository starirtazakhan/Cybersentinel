const mongoose = require("mongoose");

const securityEventSchema = new mongoose.Schema(
    {
        eventType: {
            type: String,
            required: true,
            trim: true
        },

        source: {
            type: String,
            required: true,
            trim: true
        },

        sourceIp: {
            type: String,
            trim: true
        },

        destinationIp: {
            type: String,
            trim: true
        },

        username: {
            type: String,
            trim: true
        },

        description: {
            type: String,
            required: true,
            trim: true
        },

        severity: {
            type: String,
            enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
            default: "LOW"
        },

        status: {
            type: String,
            enum: ["NEW", "INVESTIGATING", "RESOLVED"],
            default: "NEW"
        },

        detectedAt: {
            type: Date,
            default: Date.now
        },

        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("SecurityEvent", securityEventSchema);