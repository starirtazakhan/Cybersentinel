import { useEffect, useState } from "react";
import { Target } from "lucide-react";

import api from "../api/axios";
import { useAuth } from "../context/useAuth";

const severityStyles = {
    CRITICAL: "text-red-400 bg-red-500/10 border-red-500/20",
    HIGH: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    MEDIUM: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    LOW: "text-sky-400 bg-sky-500/10 border-sky-500/20",
};

const riskStyles = {
    CRITICAL: "text-red-400 bg-red-500/10 border-red-500/20",
    HIGH: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    MEDIUM: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    LOW: "text-sky-400 bg-sky-500/10 border-sky-500/20",
};

const statusOptions = [
    "OPEN",
    "INVESTIGATING",
    "CONTAINED",
    "RESOLVED",
    "CLOSED",
];

const statusStyles = {
    OPEN: "text-red-400 bg-red-500/10 border-red-500/20",
    INVESTIGATING: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    CONTAINED: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    RESOLVED: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    CLOSED: "text-slate-400 bg-slate-500/10 border-slate-500/20",
};

function Incidents() {
    const { user } = useAuth();
    const canUpdateStatus =
        user?.role === "ADMIN" || user?.role === "ANALYST";

    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [updatingId, setUpdatingId] = useState(null);
    const [updateError, setUpdateError] = useState("");

    useEffect(() => {
        let cancelled = false;

        const loadIncidents = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await api.get("/incidents");

                if (cancelled) {
                    return;
                }

                setIncidents(response.data.incidents);
            } catch (err) {
                if (cancelled) {
                    return;
                }

                console.error("Incidents loading error:", err);

                setError(
                    err.response?.data?.message ||
                    "Unable to load incidents."
                );
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadIncidents();

        return () => {
            cancelled = true;
        };
    }, []);

    const handleStatusChange = async (incidentId, newStatus) => {
        const previous = incidents;

        // Optimistic update
        setIncidents((prev) =>
            prev.map((incident) =>
                incident._id === incidentId
                    ? { ...incident, status: newStatus }
                    : incident
            )
        );

        setUpdatingId(incidentId);
        setUpdateError("");

        try {
            await api.patch(`/incidents/${incidentId}/status`, {
                status: newStatus,
            });
        } catch (err) {
            console.error("Status update error:", err);

            // Revert on failure
            setIncidents(previous);
            setUpdateError(
                err.response?.data?.message ||
                "Failed to update incident status."
            );
        } finally {
            setUpdatingId(null);
        }
    };

    return (
        <>
            {/* Page heading */}
            <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/10 ring-1 ring-sky-500/30">
                    <Target className="h-5 w-5 text-sky-400" />
                </div>

                <div>
                    <h3 className="text-2xl font-bold text-white">
                        Incidents
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                        {incidents.length} incident{incidents.length === 1 ? "" : "s"} being tracked
                    </p>
                </div>
            </div>

            {loading && (
                <div className="mb-4 rounded-lg border border-sky-500/20 bg-sky-500/5 px-4 py-3 text-sm text-sky-300">
                    Loading incidents...
                </div>
            )}

            {error && (
                <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
                    {error}
                </div>
            )}

            {updateError && (
                <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
                    {updateError}
                </div>
            )}

            {!loading && !error && (
                <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#07111f]">
                    {incidents.length > 0 ? (
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                                    <th className="px-5 py-3 font-medium">Incident</th>
                                    <th className="px-5 py-3 font-medium">Severity</th>
                                    <th className="px-5 py-3 font-medium">Risk</th>
                                    <th className="px-5 py-3 font-medium">MITRE</th>
                                    <th className="px-5 py-3 font-medium">Status</th>
                                    <th className="px-5 py-3 font-medium">Assigned To</th>
                                    <th className="px-5 py-3 font-medium">Created</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-800">
                                {incidents.map((incident) => (
                                    <tr
                                        key={incident._id}
                                        className="transition hover:bg-slate-900/40"
                                    >
                                        <td className="px-5 py-4">
                                            <p className="font-medium text-slate-200">
                                                {incident.title}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                {incident.incidentType?.replaceAll("_", " ")}
                                            </p>
                                        </td>

                                        <td className="px-5 py-4">
                                            <span
                                                className={`inline-flex rounded-md border px-2 py-1 text-[10px] font-bold ${
                                                    severityStyles[incident.severity] ||
                                                    "text-slate-400 bg-slate-500/10 border-slate-500/20"
                                                }`}
                                            >
                                                {incident.severity}
                                            </span>
                                        </td>

                                        <td className="px-5 py-4">
                                            <span
                                                className={`inline-flex rounded-md border px-2 py-1 text-[10px] font-bold ${
                                                    riskStyles[incident.riskLevel] ||
                                                    "text-slate-400 bg-slate-500/10 border-slate-500/20"
                                                }`}
                                            >
                                                {incident.riskLevel}
                                            </span>
                                            <p className="mt-1 font-mono text-[10px] text-slate-600">
                                                Score: {incident.riskScore}
                                            </p>
                                        </td>

                                        <td className="px-5 py-4 font-mono text-xs text-slate-400">
                                            {incident.mitreTechnique?.id ? (
                                                <>
                                                    <p>{incident.mitreTechnique.id}</p>
                                                    <p className="mt-1 text-[10px] text-slate-600">
                                                        {incident.mitreTechnique.name}
                                                    </p>
                                                </>
                                            ) : (
                                                "—"
                                            )}
                                        </td>

                                        <td className="px-5 py-4">
                                            {canUpdateStatus ? (
                                                <select
                                                    value={incident.status}
                                                    disabled={updatingId === incident._id}
                                                    onChange={(e) =>
                                                        handleStatusChange(
                                                            incident._id,
                                                            e.target.value
                                                        )
                                                    }
                                                    className={`rounded-md border bg-transparent px-2 py-1 text-[10px] font-bold outline-none disabled:opacity-50 ${
                                                        statusStyles[incident.status] ||
                                                        "text-slate-400 bg-slate-500/10 border-slate-500/20"
                                                    }`}
                                                >
                                                    {statusOptions.map((option) => (
                                                        <option
                                                            key={option}
                                                            value={option}
                                                            className="bg-[#0f172a] text-slate-200"
                                                        >
                                                            {option}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <span
                                                    className={`inline-flex rounded-md border px-2 py-1 text-[10px] font-bold ${
                                                        statusStyles[incident.status] ||
                                                        "text-slate-400 bg-slate-500/10 border-slate-500/20"
                                                    }`}
                                                >
                                                    {incident.status}
                                                </span>
                                            )}
                                        </td>

                                        <td className="px-5 py-4 text-xs text-slate-400">
                                            {incident.assignedTo?.name || "Unassigned"}
                                        </td>

                                        <td className="px-5 py-4 font-mono text-xs text-slate-500">
                                            {incident.createdAt
                                                ? new Date(incident.createdAt).toLocaleString()
                                                : "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="py-12 text-center text-sm text-slate-500">
                            No incidents found.
                        </div>
                    )}
                </div>
            )}
        </>
    );
}

export default Incidents;