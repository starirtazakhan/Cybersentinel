const SecurityEvent = require("../models/SecurityEvent");
const Alert = require("../models/Alert");
const Incident = require("../models/Incident");

const {
    getIpLocation
} = require("../services/ipGeolocationService");


/* =========================================================
   DATE FILTER
========================================================= */

const getDateFilter = (range, field = "createdAt") => {

    if (range === "all") {
        return {};
    }

    const now = new Date();

    const rangeMilliseconds = {
        "30m": 30 * 60 * 1000,
        "6h": 6 * 60 * 60 * 1000,
        "12h": 12 * 60 * 60 * 1000,
        "24h": 24 * 60 * 60 * 1000
    };

    const milliseconds =
        rangeMilliseconds[range] ||
        rangeMilliseconds["24h"];

    const start = new Date(
        now.getTime() - milliseconds
    );

    return {
        [field]: {
            $gte: start,
            $lte: now
        }
    };
};


/* =========================================================
   OVERVIEW
========================================================= */

const getDashboardOverview = async (req, res) => {

    try {

        const range =
            req.query.range || "24h";

        const eventFilter =
            getDateFilter(range, "createdAt");

        const alertFilter =
            getDateFilter(range, "detectedAt");

        const incidentFilter =
            getDateFilter(range, "detectedAt");


        const totalEvents =
            await SecurityEvent.countDocuments(
                eventFilter
            );


        const totalAlerts =
            await Alert.countDocuments(
                alertFilter
            );


        const activeAlerts =
            await Alert.countDocuments({
                ...alertFilter,

                status: {
                    $in: [
                        "OPEN",
                        "INVESTIGATING"
                    ]
                }
            });


        const totalIncidents =
            await Incident.countDocuments(
                incidentFilter
            );


        const openIncidents =
            await Incident.countDocuments({
                ...incidentFilter,

                status: {
                    $in: [
                        "OPEN",
                        "INVESTIGATING",
                        "CONTAINED"
                    ]
                }
            });


        res.status(200).json({

            success: true,

            range,

            overview: {
                totalEvents,
                totalAlerts,
                activeAlerts,
                totalIncidents,
                openIncidents
            }

        });

    } catch (error) {

        console.error(
            "Dashboard overview error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Server error"
        });

    }
};


/* =========================================================
   SEVERITY DISTRIBUTION
========================================================= */

const getSeverityDistribution = async (
    req,
    res
) => {

    try {

        const range =
            req.query.range || "24h";

        const dateFilter =
            getDateFilter(
                range,
                "detectedAt"
            );


        const distribution =
            await Alert.aggregate([

                {
                    $match: dateFilter
                },

                {
                    $group: {
                        _id: "$severity",

                        count: {
                            $sum: 1
                        }
                    }
                },

                {
                    $sort: {
                        count: -1
                    }
                }

            ]);


        res.status(200).json({

            success: true,

            range,

            distribution

        });

    } catch (error) {

        console.error(
            "Severity distribution error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Server error"
        });

    }
};


/* =========================================================
   RISK DISTRIBUTION
========================================================= */

const getRiskDistribution = async (
    req,
    res
) => {

    try {

        const range =
            req.query.range || "24h";


        const incidentFilter =
            getDateFilter(
                range,
                "detectedAt"
            );


        const incidents =
            await Incident.find(
                incidentFilter
            )
            .select(
                "riskLevel riskScore"
            )
            .lean();


        let distribution = [];


        /* -------------------------------------------------
           Use Incident riskLevel when incidents exist
        ------------------------------------------------- */

        if (incidents.length > 0) {

            const counts = {

                CRITICAL: 0,

                HIGH: 0,

                MEDIUM: 0,

                LOW: 0

            };


            incidents.forEach(
                (incident) => {

                    const level =
                        incident.riskLevel ||
                        "LOW";


                    if (
                        counts[level] !==
                        undefined
                    ) {

                        counts[level]++;

                    }

                }
            );


            distribution =
                Object.entries(counts)

                    .filter(
                        ([, count]) =>
                            count > 0
                    )

                    .map(
                        ([level, count]) => ({
                            _id: level,
                            count
                        })
                    );

        }


        /* -------------------------------------------------
           Fallback to Alert riskScore
        ------------------------------------------------- */

        else {

            const alerts =
                await Alert.find(
                    getDateFilter(
                        range,
                        "detectedAt"
                    )
                )
                .select(
                    "riskScore"
                )
                .lean();


            const counts = {

                CRITICAL: 0,

                HIGH: 0,

                MEDIUM: 0,

                LOW: 0

            };


            alerts.forEach(
                (alert) => {

                    const score =
                        Number(
                            alert.riskScore
                        ) || 0;


                    let level = "LOW";


                    if (score >= 80) {

                        level = "CRITICAL";

                    } else if (score >= 60) {

                        level = "HIGH";

                    } else if (score >= 30) {

                        level = "MEDIUM";

                    }


                    counts[level]++;

                }
            );


            distribution =
                Object.entries(counts)

                    .filter(
                        ([, count]) =>
                            count > 0
                    )

                    .map(
                        ([level, count]) => ({
                            _id: level,
                            count
                        })
                    );

        }


        res.status(200).json({

            success: true,

            range,

            distribution

        });

    } catch (error) {

        console.error(
            "Risk distribution error:",
            error
        );

        res.status(500).json({

            success: false,

            message: "Server error"

        });

    }
};


/* =========================================================
   INCIDENT STATUS
========================================================= */

const getIncidentStatusDistribution =
    async (req, res) => {

        try {

            const range =
                req.query.range || "24h";


            const dateFilter =
                getDateFilter(
                    range,
                    "detectedAt"
                );


            const distribution =
                await Incident.aggregate([

                    {
                        $match: dateFilter
                    },

                    {
                        $group: {

                            _id: "$status",

                            count: {
                                $sum: 1
                            }

                        }
                    },

                    {
                        $sort: {
                            count: -1
                        }
                    }

                ]);


            res.status(200).json({

                success: true,

                range,

                distribution

            });

        } catch (error) {

            console.error(
                "Incident status distribution error:",
                error
            );

            res.status(500).json({

                success: false,

                message: "Server error"

            });

        }
    };


/* =========================================================
   FORMAT TIME
========================================================= */

const formatTimeAgo = (date) => {

    const seconds =
        Math.floor(
            (
                Date.now() -
                new Date(date).getTime()
            ) / 1000
        );


    if (seconds < 60) {
        return "Just now";
    }


    const minutes =
        Math.floor(seconds / 60);


    if (minutes < 60) {
        return `${minutes}m ago`;
    }


    const hours =
        Math.floor(minutes / 60);


    if (hours < 24) {
        return `${hours}h ago`;
    }


    const days =
        Math.floor(hours / 24);


    return `${days}d ago`;
};


/* =========================================================
   RECENT ALERTS
========================================================= */

const getRecentAlerts = async (
    req,
    res
) => {

    try {

        const range =
            req.query.range || "24h";


        const dateFilter =
            getDateFilter(
                range,
                "detectedAt"
            );


        const alerts =
            await Alert.find(
                dateFilter
            )
            .sort({
                detectedAt: -1
            })
            .limit(5)
            .select(
                "title severity sourceIp detectedAt riskScore status"
            )
            .lean();


        const formatted =
            alerts.map(
                (alert) => ({

                    _id: alert._id,

                    title: alert.title,

                    source:
                        alert.sourceIp ||
                        "Unknown",

                    severity:
                        alert.severity,

                    riskScore:
                        alert.riskScore,

                    status:
                        alert.status,

                    time:
                        formatTimeAgo(
                            alert.detectedAt
                        )

                })
            );


        res.status(200).json({

            success: true,

            range,

            alerts: formatted

        });

    } catch (error) {

        console.error(
            "Recent alerts error:",
            error
        );

        res.status(500).json({

            success: false,

            message: "Server error"

        });

    }
};


/* =========================================================
   LIVE ATTACK MAP DATA
========================================================= */

const getAttackMapData = async (
    req,
    res
) => {

    try {

        const range =
            req.query.range || "24h";


        const alertFilter =
            getDateFilter(
                range,
                "detectedAt"
            );


        const eventFilter =
            getDateFilter(
                range,
                "createdAt"
            );


        const alerts =
            await Alert.find(
                alertFilter
            )
            .sort({
                detectedAt: -1
            })
            .limit(50)
            .select(
                "title severity sourceIp username riskScore status detectedAt"
            )
            .lean();


        const events =
            await SecurityEvent.find(
                eventFilter
            )
            .sort({
                createdAt: -1
            })
            .limit(50)
            .select(
                "eventType source sourceIp username severity createdAt"
            )
            .lean();


        const activity = {};


        /* =================================================
           PROCESS ALERTS
        ================================================= */

        alerts.forEach(
            (alert) => {

                if (!alert.sourceIp) {
                    return;
                }


                if (
                    !activity[
                        alert.sourceIp
                    ]
                ) {

                    activity[
                        alert.sourceIp
                    ] = {

                        sourceIp:
                            alert.sourceIp,

                        events: 0,

                        alerts: 0,

                        highestSeverity:
                            "LOW",

                        riskScore: 0,

                        lastSeen:
                            alert.detectedAt

                    };

                }


                const source =
                    activity[
                        alert.sourceIp
                    ];


                source.alerts++;


                source.riskScore =
                    Math.max(
                        source.riskScore,

                        Number(
                            alert.riskScore
                        ) || 0
                    );


                source.lastSeen =
                    alert.detectedAt;


                const severityRank = {

                    LOW: 1,

                    MEDIUM: 2,

                    HIGH: 3,

                    CRITICAL: 4

                };


                if (
                    severityRank[
                        alert.severity
                    ] >
                    severityRank[
                        source.highestSeverity
                    ]
                ) {

                    source.highestSeverity =
                        alert.severity;

                }

            }
        );


        /* =================================================
           PROCESS SECURITY EVENTS
        ================================================= */

        events.forEach(
            (event) => {

                if (!event.sourceIp) {
                    return;
                }


                if (
                    !activity[
                        event.sourceIp
                    ]
                ) {

                    activity[
                        event.sourceIp
                    ] = {

                        sourceIp:
                            event.sourceIp,

                        events: 0,

                        alerts: 0,

                        highestSeverity:
                            event.severity ||
                            "LOW",

                        riskScore: 0,

                        lastSeen:
                            event.createdAt

                    };

                }


                const source =
                    activity[
                        event.sourceIp
                    ];


                source.events++;


                const severityRank = {

                    LOW: 1,

                    MEDIUM: 2,

                    HIGH: 3,

                    CRITICAL: 4

                };


                if (
                    severityRank[
                        event.severity
                    ] >
                    severityRank[
                        source.highestSeverity
                    ]
                ) {

                    source.highestSeverity =
                        event.severity ||
                        source.highestSeverity;

                }


                if (
                    new Date(
                        event.createdAt
                    ) >
                    new Date(
                        source.lastSeen
                    )
                ) {

                    source.lastSeen =
                        event.createdAt;

                }

            }
        );


        /* =================================================
           GEOLOCATION
        ================================================= */

       /* =================================================
           GEOLOCATION
           (sequential, with a small delay between calls,
           to avoid tripping ipapi.co's free-tier rate limit
           when many unique source IPs need lookup at once)
        ================================================= */

        const sourceList =
            Object.values(activity);


        const enrichedSources = [];


        for (const source of sourceList) {

            const location =
                await getIpLocation(
                    source.sourceIp
                );


            enrichedSources.push({

                ...source,

                latitude:
                    location?.latitude ??
                    null,

                longitude:
                    location?.longitude ??
                    null,

                city:
                    location?.city ??
                    null,

                region:
                    location?.region ??
                    null,

                country:
                    location?.country ??
                    null,

                countryCode:
                    location?.countryCode ??
                    null,

                organization:
                    location?.organization ??
                    null,

                asn:
                    location?.asn ??
                    null

            });


            // Throttle: wait before the next external
            // lookup so we don't burst-request ipapi.co.
            await new Promise(
                (resolve) => setTimeout(resolve, 500)
            );

        }


        /* =================================================
           RESPONSE
        ================================================= */

        res.status(200).json({

            success: true,

            range,

            totalSources:
                enrichedSources.length,

            sources:
                enrichedSources

        });


    } catch (error) {

        console.error(
            "Attack map data error:",
            error
        );

        res.status(500).json({

            success: false,

            message: "Server error"

        });

    }
};

/* =========================================================
   EXPORTS
========================================================= */

module.exports = {

    getDashboardOverview,

    getSeverityDistribution,

    getRiskDistribution,

    getIncidentStatusDistribution,

    getRecentAlerts,

    getAttackMapData

}; 