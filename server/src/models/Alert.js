const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },

        description: {
            type: String,
            required: true,
            trim: true
        },

        alertType: {
            type: String,
            enum: [
                "BRUTE_FORCE",
                "SUSPICIOUS_LOGIN",
                "MALWARE",
                "PORT_SCAN",
                "PRIVILEGE_ESCALATION",
                "PHISHING",
                "OTHER"
            ],
            required: true
        },

        severity: {
            type: String,
            enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
            required: true
        },

        riskScore: {
            type: Number,
            min: 0,
            max: 100,
            required: true
        },

        status: {
            type: String,
            enum: [
                "OPEN",
                "INVESTIGATING",
                "RESOLVED",
                "FALSE_POSITIVE"
            ],
            default: "OPEN"
        },

        sourceIp: {
            type: String,
            trim: true
        },

        username: {
            type: String,
            trim: true
        },

        relatedEvents: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "SecurityEvent"
            }
        ],

        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        detectedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Alert", alertSchema);