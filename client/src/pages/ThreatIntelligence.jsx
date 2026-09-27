import { useEffect, useMemo, useState } from "react";
import {
    Wifi,
    RefreshCw,
    Search,
    ShieldAlert,
    Globe,
    Server,
    User,
    Activity,
    AlertTriangle,
    Eye,
    X,
} from "lucide-react";

import api from "../api/axios";

function ThreatIntelligence() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [severityFilter, setSeverityFilter] = useState("ALL");
    const [selectedIndicator, setSelectedIndicator] = useState(null);

    const loadThreatIntelligence = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");

            const response = await api.get("/threat-intelligence");

            setData(response.data);
        } catch (err) {
            console.error("Threat intelligence error:", err);

            setError(
                err.response?.data?.message ||
                    "Unable to load threat intelligence data."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        let cancelled = false;

        const initialLoad = async () => {
            try {
                setError("");

                const response = await api.get(
                    "/threat-intelligence"
                );

                if (cancelled) return;

                setData(response.data);
            } catch (err) {
                if (cancelled) return;

                console.error(
                    "Threat intelligence error:",
                    err
                );

                setError(
                    err.response?.data?.message ||
                        "Unable to load threat intelligence data."
                );
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        initialLoad();

        return () => {
            cancelled = true;
        };
    }, []);

    const summary = data?.summary || {
        totalEvents: 0,
        totalAlerts: 0,
        totalIncidents: 0,
        uniqueIndicators: 0,
        uniqueSourceIps: 0,
        uniqueDestinationIps: 0,
        criticalIndicators: 0,
        highIndicators: 0,
    };

    const indicators = data?.indicators || [];
    const usernames = data?.usernames || [];
    const recentActivity = data?.recentActivity || [];

    const filteredIndicators = useMemo(() => {
        const query = search.toLowerCase().trim();

        return indicators.filter((indicator) => {
            const matchesSearch =
                !query ||
                indicator.indicator
                    ?.toLowerCase()
                    .includes(query) ||
                indicator.sources?.some((source) =>
                    source.toLowerCase().includes(query)
                );

            const matchesSeverity =
                severityFilter === "ALL" ||
                indicator.severities?.includes(
                    severityFilter
                );

            return matchesSearch && matchesSeverity;
        });
    }, [indicators, search, severityFilter]);

    const severityClass = (severity) => {
        switch (severity) {
            case "CRITICAL":
                return "border-red-500/30 bg-red-500/10 text-red-400";

            case "HIGH":
                return "border-orange-500/30 bg-orange-500/10 text-orange-400";

            case "MEDIUM":
                return "border-yellow-500/30 bg-yellow-500/10 text-yellow-400";

            case "LOW":
                return "border-sky-500/30 bg-sky-500/10 text-sky-400";

            default:
                return "border-slate-700 bg-slate-800/50 text-slate-400";
        }
    };

    const formatDate = (date) => {
        if (!date) return "—";

        return new Date(date).toLocaleString();
    };

    if (loading) {
        return (
            <div className="flex min-h-[500px] items-center justify-center">
                <div className="flex items-center gap-3 text-slate-400">
                    <RefreshCw className="h-5 w-5 animate-spin text-sky-400" />
                    Loading threat intelligence...
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg border border-sky-500/20 bg-sky-500/10 p-2">
                            <Wifi className="h-6 w-6 text-sky-400" />
                        </div>

                        <div>
                            <h1 className="text-2xl font-semibold text-white">
                                Threat Intelligence
                            </h1>

                            <p className="mt-1 text-sm text-slate-400">
                                Observed indicators and threat activity
                                derived from your SOC telemetry.
                            </p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => loadThreatIntelligence(true)}
                    disabled={refreshing}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-sky-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <RefreshCw
                        className={`h-4 w-4 ${
                            refreshing
                                ? "animate-spin"
                                : ""
                        }`}
                    />

                    {refreshing ? "Refreshing..." : "Refresh"}
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                    <AlertTriangle className="h-5 w-5 shrink-0" />
                    {error}
                </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    icon={<Globe className="h-5 w-5" />}
                    label="Unique Indicators"
                    value={summary.uniqueIndicators}
                    description="Observed IP indicators"
                />

                <StatCard
                    icon={<Server className="h-5 w-5" />}
                    label="Source IPs"
                    value={summary.uniqueSourceIps}
                    description="Unique source addresses"
                />

                <StatCard
                    icon={<ShieldAlert className="h-5 w-5" />}
                    label="High / Critical"
                    value={
                        summary.highIndicators +
                        summary.criticalIndicators
                    }
                    description="Indicators requiring attention"
                />

                <StatCard
                    icon={<Activity className="h-5 w-5" />}
                    label="Threat Activity"
                    value={
                        summary.totalAlerts +
                        summary.totalIncidents
                    }
                    description="Alerts + incidents"
                />
            </div>

            {/* Search / Filter */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <div className="flex flex-col gap-3 lg:flex-row">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

                        <input
                            type="text"
                            value={search}
                            onChange={(e) =>
                                setSearch(e.target.value)
                            }
                            placeholder="Search IP address or source..."
                            className="w-full rounded-lg border border-slate-800 bg-slate-900 py-2.5 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-sky-500/50"
                        />
                    </div>

                    <select
                        value={severityFilter}
                        onChange={(e) =>
                            setSeverityFilter(e.target.value)
                        }
                        className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-slate-300 outline-none focus:border-sky-500/50"
                    >
                        <option value="ALL">
                            All Severities
                        </option>
                        <option value="CRITICAL">
                            Critical
                        </option>
                        <option value="HIGH">
                            High
                        </option>
                        <option value="MEDIUM">
                            Medium
                        </option>
                        <option value="LOW">
                            Low
                        </option>
                    </select>
                </div>
            </div>

            {/* Observed Indicators */}
            <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/70">
                <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
                    <div>
                        <h2 className="font-semibold text-white">
                            Observed Indicators
                        </h2>

                        <p className="mt-1 text-xs text-slate-500">
                            IP addresses observed across events,
                            alerts, and incidents.
                        </p>
                    </div>

                    <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-400">
                        {filteredIndicators.length} indicators
                    </span>
                </div>

                {filteredIndicators.length === 0 ? (
                    <div className="px-5 py-12 text-center">
                        <Globe className="mx-auto h-8 w-8 text-slate-700" />

                        <p className="mt-3 text-sm text-slate-400">
                            No indicators match your filters.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[850px]">
                            <thead>
                                <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wider text-slate-500">
                                    <th className="px-5 py-3">
                                        Indicator
                                    </th>

                                    <th className="px-5 py-3">
                                        Occurrences
                                    </th>

                                    <th className="px-5 py-3">
                                        Severity
                                    </th>

                                    <th className="px-5 py-3">
                                        Sources
                                    </th>

                                    <th className="px-5 py-3">
                                        Last Seen
                                    </th>

                                    <th className="px-5 py-3">
                                        Action
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredIndicators.map(
                                    (indicator) => (
                                        <tr
                                            key={indicator.indicator}
                                            className="border-b border-slate-900 transition hover:bg-slate-900/60"
                                        >
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="rounded-lg border border-slate-800 bg-slate-900 p-2">
                                                        <Globe className="h-4 w-4 text-sky-400" />
                                                    </div>

                                                    <div>
                                                        <p className="font-mono text-sm text-sky-400">
                                                            {
                                                                indicator.indicator
                                                            }
                                                        </p>

                                                        <p className="text-xs text-slate-600">
                                                            {
                                                                indicator.indicatorType
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-5 py-4 text-sm font-medium text-white">
                                                {
                                                    indicator.occurrences
                                                }
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {indicator.severities?.map(
                                                        (
                                                            severity
                                                        ) => (
                                                            <span
                                                                key={
                                                                    severity
                                                                }
                                                                className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${severityClass(
                                                                    severity
                                                                )}`}
                                                            >
                                                                {
                                                                    severity
                                                                }
                                                            </span>
                                                        )
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {indicator.sources?.map(
                                                        (
                                                            source
                                                        ) => (
                                                            <span
                                                                key={
                                                                    source
                                                                }
                                                                className="rounded border border-slate-800 bg-slate-900 px-2 py-1 text-[10px] text-slate-400"
                                                            >
                                                                {
                                                                    source
                                                                }
                                                            </span>
                                                        )
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-5 py-4 text-xs text-slate-500">
                                                {formatDate(
                                                    indicator.lastSeen
                                                )}
                                            </td>

                                            <td className="px-5 py-4">
                                                <button
                                                    onClick={() =>
                                                        setSelectedIndicator(
                                                            indicator
                                                        )
                                                    }
                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 transition hover:border-sky-500/40 hover:text-white"
                                                >
                                                    <Eye className="h-3.5 w-3.5" />
                                                    Details
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Two-column lower section */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                {/* Usernames */}
                <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/70">
                    <div className="border-b border-slate-800 px-5 py-4">
                        <h2 className="font-semibold text-white">
                            Observed Accounts
                        </h2>

                        <p className="mt-1 text-xs text-slate-500">
                            Usernames appearing in security telemetry.
                        </p>
                    </div>

                    {usernames.length === 0 ? (
                        <div className="px-5 py-10 text-center text-sm text-slate-500">
                            No usernames observed.
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-900">
                            {usernames
                                .slice(0, 8)
                                .map((item) => (
                                    <div
                                        key={item.username}
                                        className="flex items-center justify-between px-5 py-4"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="rounded-lg border border-slate-800 bg-slate-900 p-2">
                                                <User className="h-4 w-4 text-sky-400" />
                                            </div>

                                            <div>
                                                <p className="text-sm font-medium text-slate-200">
                                                    {
                                                        item.username
                                                    }
                                                </p>

                                                <p className="text-xs text-slate-600">
                                                    {
                                                        item.sourceIps
                                                            ?.length
                                                    }{" "}
                                                    source IP
                                                    {item.sourceIps
                                                        ?.length ===
                                                    1
                                                        ? ""
                                                        : "s"}
                                                </p>
                                            </div>
                                        </div>

                                        <span className="rounded-full border border-slate-800 bg-slate-900 px-2.5 py-1 text-xs text-slate-400">
                                            {
                                                item.occurrences
                                            }{" "}
                                            events
                                        </span>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>

                {/* Recent activity */}
                <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/70">
                    <div className="border-b border-slate-800 px-5 py-4">
                        <h2 className="font-semibold text-white">
                            Recent Threat Activity
                        </h2>

                        <p className="mt-1 text-xs text-slate-500">
                            Latest events, alerts, and incidents.
                        </p>
                    </div>

                    {recentActivity.length === 0 ? (
                        <div className="px-5 py-10 text-center text-sm text-slate-500">
                            No recent activity.
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-900">
                            {recentActivity
                                .slice(0, 8)
                                .map((activity) => (
                                    <div
                                        key={`${activity.type}-${activity.id}`}
                                        className="px-5 py-4"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="rounded border border-slate-800 bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                                                        {
                                                            activity.type
                                                        }
                                                    </span>

                                                    <span
                                                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${severityClass(
                                                            activity.severity
                                                        )}`}
                                                    >
                                                        {
                                                            activity.severity
                                                        }
                                                    </span>
                                                </div>

                                                <p className="mt-2 truncate text-sm font-medium text-slate-200">
                                                    {
                                                        activity.description
                                                    }
                                                </p>

                                                <p className="mt-1 text-xs text-slate-600">
                                                    {
                                                        activity.sourceIp ||
                                                        "No source IP"
                                                    }
                                                </p>
                                            </div>

                                            <span className="shrink-0 text-[10px] text-slate-600">
                                                {formatDate(
                                                    activity.timestamp
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Indicator details modal */}
            {selectedIndicator && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
                    onClick={() =>
                        setSelectedIndicator(null)
                    }
                >
                    <div
                        className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
                            <div>
                                <p className="text-xs uppercase tracking-wider text-slate-500">
                                    Indicator Details
                                </p>

                                <h3 className="mt-1 font-mono text-lg text-sky-400">
                                    {
                                        selectedIndicator.indicator
                                    }
                                </h3>
                            </div>

                            <button
                                onClick={() =>
                                    setSelectedIndicator(null)
                                }
                                className="rounded-lg p-2 text-slate-500 hover:bg-slate-900 hover:text-white"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 p-6">
                            <Detail
                                label="Indicator Type"
                                value={
                                    selectedIndicator.indicatorType
                                }
                            />

                            <Detail
                                label="Occurrences"
                                value={
                                    selectedIndicator.occurrences
                                }
                            />

                            <Detail
                                label="Last Seen"
                                value={formatDate(
                                    selectedIndicator.lastSeen
                                )}
                            />

                            <Detail
                                label="Sources"
                                value={
                                    selectedIndicator.sources?.join(
                                        ", "
                                    ) || "—"
                                }
                            />
                        </div>

                        <div className="border-t border-slate-800 px-6 py-5">
                            <h4 className="text-sm font-semibold text-white">
                                Related Activity
                            </h4>

                            <div className="mt-3 space-y-2">
                                {selectedIndicator.relatedActivity
                                    ?.length ? (
                                    selectedIndicator.relatedActivity.map(
                                        (
                                            activity,
                                            index
                                        ) => (
                                            <div
                                                key={
                                                    index
                                                }
                                                className="rounded-lg border border-slate-800 bg-slate-900/60 p-3"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-medium text-sky-400">
                                                        {
                                                            activity.type
                                                        }
                                                    </span>

                                                    <span
                                                        className={`rounded-full border px-2 py-0.5 text-[10px] ${severityClass(
                                                            activity.severity
                                                        )}`}
                                                    >
                                                        {
                                                            activity.severity
                                                        }
                                                    </span>
                                                </div>

                                                <p className="mt-1 text-xs text-slate-400">
                                                    {
                                                        activity.description
                                                    }
                                                </p>
                                            </div>
                                        )
                                    )
                                ) : (
                                    <p className="text-sm text-slate-500">
                                        No related activity.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({
    icon,
    label,
    value,
    description,
}) {
    return (
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-5">
            <div className="flex items-center justify-between">
                <div className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-sky-400">
                    {icon}
                </div>

                <Activity className="h-4 w-4 text-slate-700" />
            </div>

            <p className="mt-4 text-xs uppercase tracking-wider text-slate-500">
                {label}
            </p>

            <p className="mt-1 text-2xl font-semibold text-white">
                {value}
            </p>

            <p className="mt-1 text-xs text-slate-600">
                {description}
            </p>
        </div>
    );
}

function Detail({ label, value }) {
    return (
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-[10px] uppercase tracking-wider text-slate-600">
                {label}
            </p>

            <p className="mt-1 break-words text-sm text-slate-300">
                {value}
            </p>
        </div>
    );
}

export default ThreatIntelligence;