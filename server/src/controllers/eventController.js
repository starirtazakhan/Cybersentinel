const SecurityEvent = require("../models/SecurityEvent");
const {
    runAllDetections
} = require("../services/detectionService");


// ======================================================
// CREATE SECURITY EVENT
// ======================================================

const createEvent = async (req, res) => {
    try {

        const {
            eventType,
            source,
            sourceIp,
            destinationIp,
            username,
            description,
            severity,
            metadata
        } = req.body;

        // Validate required fields
        if (
            !eventType ||
            !source ||
            !description
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "eventType, source and description are required"
            });
        }

        // Create the raw security event
        const event =
            await SecurityEvent.create({
                eventType,

                source,

                sourceIp,

                destinationIp,

                username,

                description,

                severity,

                metadata,

                createdBy:
                    req.user.userId
            });


        // Run every applicable detection rule
        const detectionResult =
            await runAllDetections(event);


        return res.status(201).json({
            success: true,

            message:
                "Security event created successfully",

            event,

            alert:
                detectionResult.alert,

            incident:
                detectionResult.incident,

            autoEscalated:
                detectionResult.autoEscalated
        });

    } catch (error) {

        console.error(
            "Create security event error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to create security event",
            error:
                error.message
        });
    }
};


// ======================================================
// GET SECURITY EVENTS
// ======================================================

const getEvents = async (req, res) => {
    try {

        const events =
            await SecurityEvent.find()
                .populate(
                    "createdBy",
                    "name email role"
                )
                .sort({
                    createdAt: -1
                });

        return res.status(200).json({
            success: true,

            count:
                events.length,

            events
        });

    } catch (error) {

        console.error(
            "Get security events error:",
            error
        );

        return res.status(500).json({
            success: false,

            message:
                "Failed to retrieve security events",

            error:
                error.message
        });
    }
};


module.exports = {
    createEvent,
    getEvents
}; 