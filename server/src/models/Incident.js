const mongoose = require("mongoose");

const incidentSchema = new mongoose.Schema(
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

        incidentType: {
    type: String,
    enum: [
        "BRUTE_FORCE",
        "PHISHING" ,
        "MALWARE",
        "PORT_SCAN",
        "PRIVILEGE_ESCALATION",
        "DATA_EXFILTRATION",
        "OTHER"
    ],
    required: true
},

mitreTechnique: {
    id: {
        type: String,
        trim: true
    },

    name: {
        type: String,
        trim: true
    },

    tactic: {
        type: String,
        trim: true
    }
},

severity: { 
            type: String,
            enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
            required: true
        },

        status: {
            type: String,
            enum: [
                "OPEN",
                "INVESTIGATING",
                "CONTAINED",
                "RESOLVED",
                "CLOSED"
            ],
            default: "OPEN"
        },

        riskScore: {
            type: Number,
            min: 0,
            max: 100,
            required: true
        },
        
        riskLevel: {
            type: String,
            enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
            default: "LOW"
        },

        sourceIp: {
            type: String,
            trim: true
        },

        username: {
            type: String,
            trim: true
        },

        relatedAlerts: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Alert"
            }
        ],

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
            ref: "User",
            required: true
        },

        investigationNotes: [
            {
                note: {
                    type: String,
                    required: true
                },

                addedBy: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                    required: true
                },

                addedAt: {
                    type: Date,
                    default: Date.now
                }
            }
        ],

        detectedAt: {
            type: Date,
            default: Date.now
        },

        resolvedAt: {
            type: Date
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Incident", incidentSchema);