const crypto = require("crypto");

const User = require("../models/User");

const SYSTEM_USER_EMAIL = "system@cybersentinel.local";

let cachedSystemUserId = null;

/**
 * Finds the internal "System" user, creating it if it doesn't exist yet.
 * This user is never used to log in — it only exists so background
 * jobs (like the threat simulator) can satisfy the `createdBy` field
 * required by SecurityEvent / Alert without needing a real logged-in
 * human user.
 */
const getSystemUserId = async () => {
    if (cachedSystemUserId) {
        return cachedSystemUserId;
    }

    let systemUser = await User.findOne({ email: SYSTEM_USER_EMAIL });

    if (!systemUser) {
        // Random, unguessable, never-used-to-login password.
        // Just needs to satisfy the schema's minlength requirement.
        const randomPassword = crypto.randomBytes(32).toString("hex");

        systemUser = await User.create({
            name: "System (Threat Simulator)",
            email: SYSTEM_USER_EMAIL,
            password: randomPassword,
            role: "ADMIN",
            isActive: true
        });

        console.log("Created internal system user for automated detections.");
    }

    cachedSystemUserId = systemUser._id;
    return cachedSystemUserId;
};

module.exports = {
    getSystemUserId
};