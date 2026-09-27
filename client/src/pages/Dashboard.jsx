import { useEffect, useState } from "react";
import {
    AlertTriangle,
    Activity,
    ShieldAlert,
    ShieldCheck,
    Wifi,
    MapPin,
    RefreshCw
} from "lucide-react";

import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip
} from "recharts";

import {
    MapContainer,
    TileLayer,
    CircleMarker,
    Popup
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

import api from "../api/axios";


/* =========================================================
   CONSTANTS
========================================================= */

const SEVERITY_COLORS = {
    LOW: "#22c55e",
    MEDIUM: "#eab308",
    HIGH: "#f97316",
    CRITICAL: "#ef4444"
};

const STATUS_COLORS = {
    OPEN: "bg-red-500",
    INVESTIGATING: "bg-yellow-500",
    CONTAINED: "bg-blue-500",
    RESOLVED: "bg-green-500",
    CLOSED: "bg-slate-500"
};


/* =========================================================
   MAIN DASHBOARD
========================================================= */

export default function Dashboard() {

    const [overview, setOverview] = useState(null);

    const [severityData, setSeverityData] = useState([]);

    const [riskData, setRiskData] = useState([]);

    const [incidentStatusData, setIncidentStatusData] =
        useState([]);

    const [recentAlerts, setRecentAlerts] =
        useState([]);

    const [attackSources, setAttackSources] =
        useState([]);

    const [timeRange, setTimeRange] =
        useState("24h");

    const [dashboardLoading, setDashboardLoading] =
        useState(true);

    const [dashboardError, setDashboardError] =
        useState("");


    /* =====================================================
       LOAD DASHBOARD DATA
    ===================================================== */

        useEffect(() => {

        let mounted = true;
        let hasLoadedOnce = false;

        const loadDashboard = async () => {

            if (!hasLoadedOnce) {
                setDashboardLoading(true);
            }

            setDashboardError("");

            try {

                /*
                 * Promise.allSettled prevents one failed
                 * endpoint from making the entire dashboard
                 * blank.
                 */

                const results = await Promise.allSettled([

                    api.get("/dashboard/overview", {
                        params: {
                            range: timeRange
                        }
                    }),

                    api.get("/dashboard/severity", {
                        params: {
                            range: timeRange
                        }
                    }),

                    api.get("/dashboard/risk", {
                        params: {
                            range: timeRange
                        }
                    }),

                    api.get("/dashboard/incident-status", {
                        params: {
                            range: "all"
                        }
                    }),

                    api.get("/dashboard/recent-alerts", {
                        params: {
                            range: timeRange
                        }
                    }),

                    api.get("/dashboard/attack-map", {
                        params: {
                            range: timeRange
                        }
                    })
                ]);


                if (!mounted) return;


                /* Overview */

                if (results[0].status === "fulfilled") {

                    setOverview(
                        results[0].value.data.overview ||
                        null
                    );

                }


                /* Severity */

                if (results[1].status === "fulfilled") {

                    setSeverityData(
                        results[1].value.data.distribution ||
                        []
                    );

                }


                /* Risk */

                if (results[2].status === "fulfilled") {

                    setRiskData(
                        results[2].value.data.distribution ||
                        []
                    );

                }


                /* Incident status */

               if (results[3].status === "fulfilled") {
    const incidentResponse = results[3].value.data;

    console.log("INCIDENT STATUS RESPONSE:", incidentResponse);

    const distribution = incidentResponse?.distribution;

    console.log("INCIDENT STATUS DISTRIBUTION:", distribution);

    setIncidentStatusData(
        Array.isArray(distribution)
            ? distribution
            : []
    );
} else {
    console.error(
        "INCIDENT STATUS REQUEST FAILED:",
        results[3].reason
    );
} 

                if (results[3].status === "fulfilled") {
    console.log(
        "INCIDENT STATUS API RESPONSE:",
        results[3].value.data
    );

    console.log(
        "INCIDENT STATUS DISTRIBUTION:",
        results[3].value.data.distribution
    );

    setIncidentStatusData(
        results[3].value.data.distribution || []
    );
}


                /* Recent alerts */

                if (results[4].status === "fulfilled") {

                    setRecentAlerts(
                        results[4].value.data.alerts ||
                        []
                    );

                }


                /* Attack map */

                if (results[5].status === "fulfilled") {

                    setAttackSources(
                        results[5].value.data.sources ||
                        []
                    );

                }


                /*
                 * Only show a dashboard error if the core
                 * overview endpoint failed.
                 */

                if (
                    results[0].status === "rejected"
                ) {

                    setDashboardError(
                        "Unable to load dashboard overview."
                    );
                }

            } catch (error) {

                console.error(
                    "Dashboard loading error:",
                    error
                );

                if (mounted) {

                    setDashboardError(
                        "Unable to load dashboard data."
                    );

                }

            } finally {

                if (mounted) {
                    setDashboardLoading(false);
                }

                hasLoadedOnce = true;

            }
        };


        loadDashboard();

        // Poll every 15 seconds so new simulator-generated
        // events/alerts show up without a manual refresh.
        const intervalId = setInterval(loadDashboard, 15000);


        return () => {
            mounted = false;
            clearInterval(intervalId);
        };

    }, [timeRange]); 
    console.log("INCIDENT STATUS STATE:", incidentStatusData);


    /* =====================================================
       REFRESH
    ===================================================== */

    const refreshDashboard = () => {

        setTimeRange((current) => {

            /*
             * Changing to the same value does not trigger
             * useEffect, so force a tiny state cycle.
             */

            return current === "24h"
                ? "12h"
                : current;
        });

        window.location.reload();
    };


    /* =====================================================
       SEVERITY TOTAL
    ===================================================== */

    const severityTotal =
        severityData.reduce(
            (sum, item) =>
                sum + Number(item.count || 0),
            0
        );


    /* =====================================================
       INCIDENT STATUS TOTAL
    ===================================================== */

    const incidentTotal =
        incidentStatusData.reduce(
            (sum, item) =>
                sum + Number(item.count || 0),
            0
        );


    return (
        <div className="min-h-full bg-[#020817] p-4 md:p-6">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                <div>

                    <h1 className="text-2xl font-bold text-white">
                        Security Operations Center
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Real-time security monitoring and incident analysis
                    </p>

                </div>


                <div className="flex items-center gap-3">

                    <select
                        value={timeRange}
                        onChange={(e) =>
                            setTimeRange(e.target.value)
                        }
                        className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-200 outline-none focus:border-cyan-500"
                    >

                        <option value="30m">
                            Last 30 Minutes
                        </option>

                        <option value="6h">
                            Last 6 Hours
                        </option>

                        <option value="12h">
                            Last 12 Hours
                        </option>

                        <option value="24h">
                            Last 24 Hours
                        </option>

                        <option value="all">
                            All Time
                        </option>

                    </select>


                    <button
                        onClick={refreshDashboard}
                        className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-500 hover:text-white"
                    >

                        <RefreshCw size={16} />

                        Refresh

                    </button>

                </div>

            </div>


            {/* =================================================
                ERROR
            ================================================= */}

            {dashboardError && (

                <div className="mb-5 rounded-lg border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-400">

                    {dashboardError}

                </div>

            )}


            {/* =================================================
                KPI CARDS
            ================================================= */}

            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">

                <StatCard
                    title="Total Events"
                    value={
                        dashboardLoading
                            ? "..."
                            : overview?.totalEvents ?? 0
                    }
                    icon={<Activity size={20} />}
                    description="Security events"
                />


                <StatCard
                    title="Total Alerts"
                    value={
                        dashboardLoading
                            ? "..."
                            : overview?.totalAlerts ?? 0
                    }
                    icon={<AlertTriangle size={20} />}
                    description="Detected threats"
                />


                <StatCard
                    title="Active Alerts"
                    value={
                        dashboardLoading
                            ? "..."
                            : overview?.activeAlerts ?? 0
                    }
                    icon={<ShieldAlert size={20} />}
                    description="Requires attention"
                />


                <StatCard
                    title="Total Incidents"
                    value={
                        dashboardLoading
                            ? "..."
                            : overview?.totalIncidents ?? 0
                    }
                    icon={<ShieldCheck size={20} />}
                    description="Security incidents"
                />


                <StatCard
                    title="Open Incidents"
                    value={
                        dashboardLoading
                            ? "..."
                            : overview?.openIncidents ?? 0
                    }
                    icon={<Wifi size={20} />}
                    description="Under investigation"
                />

            </div>


            {/* =================================================
                MAP + SEVERITY
            ================================================= */}

            <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-[2fr_1fr]">


                {/* ATTACK MAP */}

                <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#071120]">

                    <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">

                        <div>

                            <h2 className="text-lg font-semibold text-white">
                                Live Attack Map
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Global security activity
                            </p>

                        </div>


                        <div className="flex items-center gap-2 text-sm text-emerald-400">

                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />

                            Monitoring

                        </div>

                    </div>


                    <div className="h-[420px]">

                        <AttackMap
                            sources={attackSources}
                        />

                    </div>

                </div>


                {/* SEVERITY */}

                <div className="rounded-2xl border border-slate-800 bg-[#071120]">

                    <div className="border-b border-slate-800 px-6 py-5">

                        <h2 className="text-lg font-semibold text-white">
                            Alert Severity
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Current threat severity
                        </p>

                    </div>


                    <div className="p-5">

                        {severityData.length > 0 ? (

                            <>

                                <div className="h-[260px]">

                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >

                                        <PieChart>

                                            <Pie
                                                data={severityData}
                                                dataKey="count"
                                                nameKey="_id"
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={70}
                                                outerRadius={105}
                                                paddingAngle={3}
                                            >

                                                {severityData.map(
                                                    (entry) => (

                                                        <Cell
                                                            key={entry._id}
                                                            fill={
                                                                SEVERITY_COLORS[
                                                                    entry._id
                                                                ] ||
                                                                "#64748b"
                                                            }
                                                        />

                                                    )
                                                )}

                                            </Pie>


                                            <Tooltip
                                                contentStyle={{
                                                    background:
                                                        "#0f172a",
                                                    border:
                                                        "1px solid #334155",
                                                    borderRadius:
                                                        "8px"
                                                }}
                                            />

                                        </PieChart>

                                    </ResponsiveContainer>

                                </div>


                                <div className="space-y-3">

                                    {severityData.map(
                                        (item) => (

                                            <div
                                                key={item._id}
                                                className="flex items-center justify-between"
                                            >

                                                <div className="flex items-center gap-2">

                                                    <span
                                                        className="h-2.5 w-2.5 rounded-full"
                                                        style={{
                                                            backgroundColor:
                                                                SEVERITY_COLORS[
                                                                    item._id
                                                                ] ||
                                                                "#64748b"
                                                        }}
                                                    />

                                                    <span className="text-sm text-slate-300">
                                                        {item._id}
                                                    </span>

                                                </div>


                                                <span className="text-sm font-semibold text-white">
                                                    {item.count}
                                                </span>

                                            </div>

                                        )
                                    )}

                                </div>


                                <div className="mt-5 border-t border-slate-800 pt-4 text-center">

                                    <span className="text-2xl font-bold text-white">
                                        {severityTotal}
                                    </span>

                                    <span className="ml-2 text-sm text-slate-500">
                                        total alerts
                                    </span>

                                </div>

                            </>

                        ) : (

                            <EmptyState
                                title="No alert data"
                                description="No alerts were detected in this time range."
                            />

                        )}

                    </div>

                </div>

            </div>


            {/* =================================================
                INCIDENT STATUS + RISK
            ================================================= */}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">


                {/* INCIDENT STATUS */}

                <div className="rounded-2xl border border-slate-800 bg-[#071120]">

                    <div className="border-b border-slate-800 px-6 py-5">

                        <h2 className="text-lg font-semibold text-white">
                            Incident Status
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Current investigation workload
                        </p>

                    </div>


                    <div className="p-6">

                        {incidentStatusData.length > 0 ? (

                            <div className="space-y-5">

                                {incidentStatusData.map(
                                    (item) => (

                                        <StatusBar
                                            key={item._id}
                                            label={item._id}
                                            value={item.count}
                                            total={incidentTotal}
                                        />

                                    )
                                )}

                            </div>

                        ) : (

                            <EmptyState
                                title="No incidents in this time range"
                                description="Create an incident from an active alert to begin investigation."
                            />

                        )}

                    </div>

                </div>


                {/* RISK DISTRIBUTION */}

                <div className="rounded-2xl border border-slate-800 bg-[#071120]">

                    <div className="border-b border-slate-800 px-6 py-5">

                        <h2 className="text-lg font-semibold text-white">
                            Risk Distribution
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Assets grouped by current risk level
                        </p>

                    </div>


                    <div className="p-6">

                        {riskData.length > 0 ? (

                            <div className="space-y-5">

                                {riskData.map(
                                    (item) => {

                                        const total =
                                            riskData.reduce(
                                                (
                                                    sum,
                                                    x
                                                ) =>
                                                    sum +
                                                    Number(
                                                        x.count ||
                                                        0
                                                    ),
                                                0
                                            );

                                        return (

                                            <StatusBar
                                                key={item._id}
                                                label={item._id}
                                                value={item.count}
                                                total={total}
                                            />

                                        );

                                    }
                                )}

                            </div>

                        ) : (

                            <EmptyState
                                title="No risk data"
                                description="No incidents or risk-scored alerts were found in this time range."
                            />

                        )}

                    </div>

                </div>

            </div>


            {/* =================================================
                RECENT ALERTS
            ================================================= */}

            <div className="mt-6 rounded-2xl border border-slate-800 bg-[#071120]">

                <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">

                    <div>

                        <h2 className="text-lg font-semibold text-white">
                            Recent Alerts
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Latest security detections
                        </p>

                    </div>

                    <span className="text-xs text-slate-500">
                        Showing latest 5
                    </span>

                </div>


                <div className="divide-y divide-slate-800">

                    {recentAlerts.length > 0 ? (

                        recentAlerts.map(
                            (alert) => (

                                <AlertRow
                                    key={alert._id}
                                    alert={alert}
                                />

                            )
                        )

                    ) : (

                        <div className="p-8 text-center text-sm text-slate-500">
                            No alerts found in this time range.
                        </div>

                    )}

                </div>

            </div>

        </div>
    );
}


/* =========================================================
   ATTACK MAP
========================================================= */

function AttackMap({ sources }) {

    /*
     * Only public IPs with geographic coordinates are
     * plotted.
     *
     * Internal/private IPs remain visible in the
     * activity summary rather than being given fake
     * coordinates.
     */

    const mappedSources = sources.filter(
        (source) =>
            typeof source.latitude === "number" &&
            typeof source.longitude === "number"
    );



    return (

        <div className="relative h-full w-full">

            <style>{`
                .map-tiles-dark {
                    filter: invert(1) hue-rotate(180deg) brightness(0.9) contrast(0.9);
                }
            `}</style>

            <MapContainer
                center={[20, 0]}
                zoom={2}
                minZoom={2}
                maxZoom={8}
                scrollWheelZoom={true}
                className="h-full w-full"
            >

                <TileLayer
                    attribution="&copy; OpenStreetMap contributors"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    className="map-tiles-dark"
                />

                {mappedSources.map(
                    (source) => {

                        const severity =
                            source.highestSeverity ||
                            "LOW";


                        const radius = {

                            LOW: 6,

                            MEDIUM: 8,

                            HIGH: 11,

                            CRITICAL: 14

                        }[severity] || 7;


                        return (

                            <CircleMarker
                                key={source.sourceIp}
                                center={[
                                    source.latitude,
                                    source.longitude
                                ]}
                                radius={radius}
                                pathOptions={{
                                    color:
                                        SEVERITY_COLORS[
                                            severity
                                        ] || "#22c55e",

                                    fillColor:
                                        SEVERITY_COLORS[
                                            severity
                                        ] || "#22c55e",

                                    fillOpacity: 0.75,

                                    weight: 2
                                }}
                            >

                                <Popup>

                                    <div className="min-w-[200px]">

                                        <div className="mb-2 flex items-center gap-2">

                                            <MapPin size={16} />

                                            <strong>
                                                Security Source
                                            </strong>

                                        </div>


                                        <div className="space-y-1 text-sm">

                                               <div>
                                                IP:{" "}
                                                <span className="font-mono">
                                                {source.sourceIp}
                                            </span>
                                        </div>

                                            <div>
                                                Severity:{" "}
                                                {severity}
                                            </div>

                                            <div>
                                                Events:{" "}
                                                {source.events || 0}
                                            </div>

                                            <div>
                                                Alerts:{" "}
                                                {source.alerts || 0}
                                            </div>

                                            <div>
                                                Risk Score:{" "}
                                                {source.riskScore || 0}
                                            </div>

                                            {source.city && (

                                                <div>
                                                    Location:{" "}
                                                    {source.city}
                                                    {source.country
                                                        ? `, ${source.country}`
                                                        : ""}
                                                </div>

                                            )}

                                        </div>

                                    </div>

                                </Popup>

                            </CircleMarker>

                        );

                    }
                )}

            </MapContainer>


            {/* MAP INFORMATION */}

            <div className="pointer-events-none absolute left-4 top-4 z-[1000] rounded-lg border border-slate-700 bg-slate-950/90 px-4 py-3 shadow-xl">

                <div className="flex items-center gap-2">

                    <span className="h-2 w-2 rounded-full bg-emerald-400" />

                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                        Live Monitoring
                    </span>

                </div>


                <div className="mt-1 text-xs text-slate-500">

                    {sources.length} detected source
                    {sources.length === 1 ? "" : "s"}

                </div>

            </div>


            {/* NO PUBLIC GEO DATA */}

            {mappedSources.length === 0 && (

                <div className="pointer-events-none absolute inset-0 z-[900] flex items-center justify-center">

                    <div className="rounded-xl border border-slate-700 bg-slate-950/90 px-6 py-5 text-center shadow-xl">

                        <MapPin
                            size={28}
                            className="mx-auto mb-2 text-cyan-400"
                        />

                        <div className="text-sm font-semibold text-slate-200">
                            Monitoring security activity
                        </div>

                        <div className="mt-1 max-w-xs text-xs text-slate-500">

                            {sources.length > 0
                                ? "Current activity is from internal/private IP addresses or has no geographic enrichment."
                                : "No source IP activity has been detected in this time range."}

                        </div>

                    </div>

                </div>

            )}

        </div>
    );
}


/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
    title,
    value,
    icon,
    description
}) {

    return (

        <div className="rounded-xl border border-slate-800 bg-[#071120] p-5">

            <div className="flex items-start justify-between">

                <div>

                    <p className="text-sm text-slate-500">
                        {title}
                    </p>

                    <p className="mt-2 text-3xl font-bold text-white">
                        {value}
                    </p>

                </div>


                <div className="rounded-lg border border-slate-700 bg-slate-900 p-2 text-cyan-400">
                    {icon}
                </div>

            </div>


            <p className="mt-3 text-xs text-slate-600">
                {description}
            </p>

        </div>

    );
}


/* =========================================================
   STATUS BAR
========================================================= */

function StatusBar({
    label,
    value,
    total
}) {

    console.log("STATUS BAR:", {
    label,
    value,
    total,
    isIncidentStatus:
        ["OPEN", "INVESTIGATING", "CONTAINED", "RESOLVED", "CLOSED"].includes(label)
}); 

    const percentage =
        total > 0
            ? Math.round(
                (Number(value) / total) * 100
            )
            : 0;


    const barColor =
        STATUS_COLORS[label] ||
        "bg-cyan-500";


    return (

        <div>

            <div className="mb-2 flex items-center justify-between">

                <div className="flex items-center gap-2">

                    <span
                        className={`h-2.5 w-2.5 rounded-full ${barColor}`}
                    />

                    <span className="text-sm font-medium text-slate-300">
                        {label}
                    </span>

                </div>


                <div className="flex items-center gap-2">

                    <span className="text-sm font-semibold text-white">
                        {value}
                    </span>

                    <span className="text-xs text-slate-600">
                        ({percentage}%)
                    </span>

                </div>

            </div>


            <div className="h-2 overflow-hidden rounded-full bg-slate-800">

                <div
                    className={`h-full rounded-full ${barColor} transition-all duration-500`}
                    style={{
                        width: `${percentage}%`
                    }}
                />

            </div>

        </div>

    );
}


/* =========================================================
   ALERT ROW
========================================================= */

function AlertRow({ alert }) {

    const severity =
        alert.severity || "LOW";


    const severityColor =
        SEVERITY_COLORS[severity] ||
        "#64748b";


    return (

        <div className="flex flex-col gap-3 px-6 py-4 transition hover:bg-slate-900/40 md:flex-row md:items-center md:justify-between">

            <div className="flex items-start gap-3">

                <span
                    className="mt-1 h-2.5 w-2.5 rounded-full"
                    style={{
                        backgroundColor:
                            severityColor
                    }}
                />


                <div>

                    <p className="text-sm font-medium text-slate-200">
                        {alert.title}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                        Source:{" "}
                        {alert.source || "Unknown"}
                    </p>

                </div>

            </div>


            <div className="flex items-center gap-4">

                <span
                    className="text-xs font-semibold"
                    style={{
                        color:
                            severityColor
                    }}
                >
                    {severity}
                </span>


                {alert.riskScore !== undefined && (

                    <span className="text-xs text-slate-500">
                        Risk {alert.riskScore}
                    </span>

                )}


                <span className="text-xs text-slate-600">
                    {alert.time || "Unknown"}
                </span>

            </div>

        </div>

    );
}


/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState({
    title,
    description
}) {

    return (

        <div className="flex min-h-[220px] items-center justify-center">

            <div className="text-center">

                <Activity
                    size={28}
                    className="mx-auto mb-3 text-slate-700"
                />

                <p className="text-sm font-medium text-slate-300">
                    {title}
                </p>

                <p className="mx-auto mt-2 max-w-sm text-xs text-slate-600">
                    {description}
                </p>

            </div>

        </div>

    );
}