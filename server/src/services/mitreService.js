const mitreMappings = {
    BRUTE_FORCE: {
        id: "T1110",
        name: "Brute Force",
        tactic: "Credential Access"
    },

    PORT_SCAN: {
        id: "T1046",
        name: "Network Service Scanning",
        tactic: "Discovery"
    },

    PRIVILEGE_ESCALATION: {
        id: "T1068",
        name: "Exploitation for Privilege Escalation",
        tactic: "Privilege Escalation"
    },

    MALWARE: {
        id: "T1204",
        name: "User Execution",
        tactic: "Execution"
    },

    DATA_EXFILTRATION: {
        id: "T1041",
        name: "Exfiltration Over C2 Channel",
        tactic: "Exfiltration"
    }
};

const getMitreMapping = (alertType) => {
    return mitreMappings[alertType] || null;
};

module.exports = {
    getMitreMapping
};