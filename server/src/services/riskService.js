const calculateRiskScore = ({
    severity,
    eventCount = 1,
    isRepeated = false,
    mitreTechnique = null
}) => {

    let score = 0;

    // Severity contribution
    switch (severity) {
        case "LOW":
            score += 15;
            break;

        case "MEDIUM":
            score += 35;
            break;

        case "HIGH":
            score += 60;
            break;

        case "CRITICAL":
            score += 80;
            break;

        default:
            score += 10;
    }

    // Repeated activity
    if (isRepeated) {
        score += 10;
    }

    // Multiple related events
    if (eventCount >= 5) {
        score += 10;
    } else if (eventCount >= 3) {
        score += 5;
    }

    // MITRE-mapped activity
    if (mitreTechnique) {
        score += 5;
    }

    // Maximum score = 100
    score = Math.min(score, 100);

    let riskLevel;

    if (score >= 80) {
        riskLevel = "CRITICAL";
    } else if (score >= 60) {
        riskLevel = "HIGH";
    } else if (score >= 30) {
        riskLevel = "MEDIUM";
    } else {
        riskLevel = "LOW";
    }

    return {
        score,
        riskLevel
    };
};


// TEMPORARY TEST
const testRisk = calculateRiskScore({
    severity: "HIGH",
    eventCount: 5,
    isRepeated: true,
    mitreTechnique: "T1110"
});

console.log("========== RISK ENGINE TEST ==========");
console.log(testRisk);
console.log("======================================");


module.exports = {
    calculateRiskScore
};