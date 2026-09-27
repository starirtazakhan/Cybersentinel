import { useEffect, useMemo, useState } from "react";
import {
    LockKeyhole,
    RefreshCw,
    Search,
    ShieldAlert,
    Target,
    Activity,
    Layers,
    Eye,
    X,
} from "lucide-react";

import api from "../api/axios";

function Mitre() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [severityFilter, setSeverityFilter] =
        useState("ALL");
    const [selectedTechnique, setSelectedTechnique] =
        useState(null);

    useEffect(() => {
        let cancelled = false;

        const loadMitre = async () => {
            try {
                setError("");

                const response =
                    await api.get("/mitre");

                if (cancelled) return;

                setData(response.data);
            } catch (err) {
                if (cancelled) return;

                console.error(
                    "MITRE intelligence error:",
                    err
                );

                setError(
                    err.response?.data?.message ||
                        "Unable to load MITRE ATT&CK data."
                );
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadMitre();

        return () => {
            cancelled = true;
        };
    }, []);

    const refresh = async () => {
        try {
            setRefreshing(true);
            setError("");

            const response =
                await api.get("/mitre");

            setData(response.data);
        } catch (err) {
            console.error(
                "MITRE refresh error:",
                err
            );

            setError(
                err.response?.data?.message ||
                    "Unable to refresh MITRE data."
            );
        } finally {
            setRefreshing(false);
        }
    };

    const summary = data?.summary || {
        techniquesObserved: 0,
        tacticsObserved: 0,
        totalMappedActivity: 0,
        criticalTechniques: 0,
        highTechniques: 0,
        totalAlerts: 0,
        totalIncidents: 0,
    };

    const techniques = data?.techniques || [];
    const tactics = data?.tactics || [];

    const filteredTechniques = useMemo(() => {
        const query =
            search.toLowerCase().trim();

        return techniques.filter((technique) => {
            const matchesSearch =
                !query ||
                technique.id
                    ?.toLowerCase()
                    .includes(query) ||
                technique.name
                    ?.toLowerCase()
                    .includes(query) ||
                technique.tactic
                    ?.toLowerCase()
                    .includes(query);

            const matchesSeverity =
                severityFilter === "ALL" ||
                technique.highestSeverity ===
                    severityFilter;

            return (
                matchesSearch &&
                matchesSeverity
            );
        });
    }, [
        techniques,
        search,
        severityFilter,
    ]);

    const severityClass = (severity) => {
        switch (severity) {
            case "CRITICAL":
                return "border-red-500/30 bg-red-500/10 text-red-400";

            case "HIGH":
                return "border-orange-500/30 bg-orange-500/10 text-orange-400";

            case "MEDIUM":
                return "border-yellow-500/30 bg-yellow-500/10 text-yellow-400";

            default:
                return "border-sky-500/30 bg-sky-500/10 text-sky-400";
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[500px] items-center justify-center">
                <div className="flex items-center gap-3 text-slate-400">
                    <RefreshCw className="h-5 w-5 animate-spin text-sky-400" />
                    Loading MITRE ATT&CK intelligence...
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div className="flex items-center gap-3">
                    <div className="rounded-lg border border-sky-500/20 bg-sky-500/10 p-2">
                        <LockKeyhole className="h-6 w-6 text-sky-400" />
                    </div>

                    <div>
                        <h1 className="text-2xl font-semibold text-white">
                            MITRE ATT&CK
                        </h1>

                        <p className="mt-1 text-sm text-slate-400">
                            Techniques observed across
                            your alerts and incidents.
                        </p>
                    </div>
                </div>

                <button
                    onClick={refresh}
                    disabled={refreshing}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300 hover:border-sky-500/40 hover:text-white disabled:opacity-50"
                >
                    <RefreshCw
                        className={`h-4 w-4 ${
                            refreshing
                                ? "animate-spin"
                                : ""
                        }`}
                    />

                    {refreshing
                        ? "Refreshing..."
                        : "Refresh"}
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                    {error}
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    icon={
                        <Target className="h-5 w-5" />
                    }
                    label="Techniques Observed"
                    value={
                        summary.techniquesObserved
                    }
                    description="Mapped ATT&CK techniques"
                />

                <StatCard
                    icon={
                        <Layers className="h-5 w-5" />
                    }
                    label="Tactics Observed"
                    value={
                        summary.tacticsObserved
                    }
                    description="ATT&CK tactic categories"
                />

                <StatCard
                    icon={
                        <Activity className="h-5 w-5" />
                    }
                    label="Mapped Activity"
                    value={
                        summary.totalMappedActivity
                    }
                    description="Alerts + incidents"
                />

                <StatCard
                    icon={
                        <ShieldAlert className="h-5 w-5" />
                    }
                    label="High / Critical"
                    value={
                        summary.highTechniques +
                        summary.criticalTechniques
                    }
                    description="Techniques requiring attention"
                />
            </div>

            {/* Tactics */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-5">
                <div className="mb-4">
                    <h2 className="font-semibold text-white">
                        Observed ATT&CK Tactics
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                        Tactics represented by actual
                        activity in the SOC.
                    </p>
                </div>

                {tactics.length === 0 ? (
                    <p className="py-8 text-center text-sm text-slate-500">
                        No mapped MITRE activity found.
                    </p>
                ) : (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                        {tactics.map((tactic) => (
                            <div
                                key={tactic.tactic}
                                className="rounded-lg border border-slate-800 bg-slate-900/60 p-4"
                            >
                                <p className="text-sm font-medium text-slate-200">
                                    {tactic.tactic}
                                </p>

                                <div className="mt-3 flex items-end justify-between">
                                    <span className="text-2xl font-semibold text-sky-400">
                                        {
                                            tactic.occurrences
                                        }
                                    </span>

                                    <span className="text-xs text-slate-600">
                                        {
                                            tactic.techniques
                                        }{" "}
                                        technique
                                        {tactic.techniques ===
                                        1
                                            ? ""
                                            : "s"}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-3 lg:flex-row">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

                    <input
                        value={search}
                        onChange={(e) =>
                            setSearch(e.target.value)
                        }
                        placeholder="Search technique ID, name, or tactic..."
                        className="w-full rounded-lg border border-slate-800 bg-slate-950 py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-sky-500/50"
                    />
                </div>

                <select
                    value={severityFilter}
                    onChange={(e) =>
                        setSeverityFilter(
                            e.target.value
                        )
                    }
                    className="rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-300 outline-none"
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

            {/* Technique table */}
            <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/70">
                <div className="border-b border-slate-800 px-5 py-4">
                    <h2 className="font-semibold text-white">
                        Technique Coverage
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                        MITRE techniques detected in your
                        actual SOC activity.
                    </p>
                </div>

                {filteredTechniques.length === 0 ? (
                    <div className="py-12 text-center">
                        <Target className="mx-auto h-8 w-8 text-slate-700" />

                        <p className="mt-3 text-sm text-slate-500">
                            No techniques match the
                            current filters.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[850px]">
                            <thead>
                                <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wider text-slate-500">
                                    <th className="px-5 py-3">
                                        Technique
                                    </th>

                                    <th className="px-5 py-3">
                                        Tactic
                                    </th>

                                    <th className="px-5 py-3">
                                        Alerts
                                    </th>

                                    <th className="px-5 py-3">
                                        Incidents
                                    </th>

                                    <th className="px-5 py-3">
                                        Activity
                                    </th>

                                    <th className="px-5 py-3">
                                        Risk
                                    </th>

                                    <th className="px-5 py-3">
                                        Action
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredTechniques.map(
                                    (technique) => (
                                        <tr
                                            key={
                                                technique.id
                                            }
                                            className="border-b border-slate-900 hover:bg-slate-900/60"
                                        >
                                            <td className="px-5 py-4">
                                                <div>
                                                    <p className="font-mono text-sm font-semibold text-sky-400">
                                                        {
                                                            technique.id
                                                        }
                                                    </p>

                                                    <p className="mt-1 text-xs text-slate-300">
                                                        {
                                                            technique.name
                                                        }
                                                    </p>
                                                </div>
                                            </td>

                                            <td className="px-5 py-4 text-xs text-slate-400">
                                                {
                                                    technique.tactic
                                                }
                                            </td>

                                            <td className="px-5 py-4 text-sm text-slate-300">
                                                {
                                                    technique.alertCount
                                                }
                                            </td>

                                            <td className="px-5 py-4 text-sm text-slate-300">
                                                {
                                                    technique.incidentCount
                                                }
                                            </td>

                                            <td className="px-5 py-4 text-sm font-semibold text-white">
                                                {
                                                    technique.totalOccurrences
                                                }
                                            </td>

                                            <td className="px-5 py-4">
                                                <div>
                                                    <span
                                                        className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${severityClass(
                                                            technique.highestSeverity
                                                        )}`}
                                                    >
                                                        {
                                                            technique.highestSeverity
                                                        }
                                                    </span>

                                                    <p className="mt-1 text-[10px] text-slate-600">
                                                        Avg. risk{" "}
                                                        {
                                                            technique.averageRiskScore
                                                        }
                                                    </p>
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                <button
                                                    onClick={() =>
                                                        setSelectedTechnique(
                                                            technique
                                                        )
                                                    }
                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 hover:border-sky-500/40 hover:text-white"
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

            {/* Details modal */}
            {selectedTechnique && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
                    onClick={() =>
                        setSelectedTechnique(null)
                    }
                >
                    <div
                        className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >
                        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
                            <div>
                                <p className="font-mono text-sm text-sky-400">
                                    {
                                        selectedTechnique.id
                                    }
                                </p>

                                <h3 className="mt-1 text-lg font-semibold text-white">
                                    {
                                        selectedTechnique.name
                                    }
                                </h3>

                                <p className="mt-1 text-xs text-slate-500">
                                    {
                                        selectedTechnique.tactic
                                    }
                                </p>
                            </div>

                            <button
                                onClick={() =>
                                    setSelectedTechnique(
                                        null
                                    )
                                }
                                className="rounded-lg p-2 text-slate-500 hover:bg-slate-900 hover:text-white"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 p-6 md:grid-cols-4">
                            <Detail
                                label="Alerts"
                                value={
                                    selectedTechnique.alertCount
                                }
                            />

                            <Detail
                                label="Incidents"
                                value={
                                    selectedTechnique.incidentCount
                                }
                            />

                            <Detail
                                label="Occurrences"
                                value={
                                    selectedTechnique.totalOccurrences
                                }
                            />

                            <Detail
                                label="Average Risk"
                                value={
                                    selectedTechnique.averageRiskScore
                                }
                            />
                        </div>

                        <div className="border-t border-slate-800 px-6 py-5">
                            <h4 className="font-semibold text-white">
                                Related Incidents
                            </h4>

                            <div className="mt-3 space-y-2">
                                {selectedTechnique.relatedIncidents?.length ? (
                                    selectedTechnique.relatedIncidents.map(
                                        (incident) => (
                                            <div
                                                key={
                                                    incident.id
                                                }
                                                className="rounded-lg border border-slate-800 bg-slate-900/60 p-3"
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <p className="text-sm text-slate-200">
                                                        {
                                                            incident.title
                                                        }
                                                    </p>

                                                    <span
                                                        className={`rounded-full border px-2 py-1 text-[10px] ${severityClass(
                                                            incident.severity
                                                        )}`}
                                                    >
                                                        {
                                                            incident.severity
                                                        }
                                                    </span>
                                                </div>

                                                <p className="mt-1 text-xs text-slate-600">
                                                    Risk{" "}
                                                    {
                                                        incident.riskScore
                                                    }{" "}
                                                    ·{" "}
                                                    {
                                                        incident.status
                                                    }
                                                </p>
                                            </div>
                                        )
                                    )
                                ) : (
                                    <p className="text-sm text-slate-500">
                                        No related incidents.
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
            <div className="rounded-lg border border-slate-800 bg-slate-900 p-2 text-sky-400 w-fit">
                {icon}
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

            <p className="mt-1 text-lg font-semibold text-slate-200">
                {value}
            </p>
        </div>
    );
}

export default Mitre;