import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";

import api from "../api/axios";

const severityStyles = {
    CRITICAL: "text-red-400 bg-red-500/10 border-red-500/20",
    HIGH: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    MEDIUM: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    LOW: "text-sky-400 bg-sky-500/10 border-sky-500/20",
};

const statusStyles = {
    OPEN: "text-red-400 bg-red-500/10 border-red-500/20",
    INVESTIGATING: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    RESOLVED: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    FALSE_POSITIVE: "text-slate-400 bg-slate-500/10 border-slate-500/20",
};

function Alerts() {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        const loadAlerts = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await api.get("/alerts");

                if (cancelled) {
                    return;
                }

                setAlerts(response.data.alerts);
            } catch (err) {
                if (cancelled) {
                    return;
                }

                console.error("Alerts loading error:", err);

                setError(
                    err.response?.data?.message ||
                    "Unable to load alerts."
                );
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadAlerts();

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <>
            {/* Page heading */}
            <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/10 ring-1 ring-sky-500/30">
                    <ShieldAlert className="h-5 w-5 text-sky-400" />
                </div>

                <div>
                    <h3 className="text-2xl font-bold text-white">
                        Alerts
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                        {alerts.length} alert{alerts.length === 1 ? "" : "s"} across your environment
                    </p>
                </div>
            </div>

            {loading && (
                <div className="mb-4 rounded-lg border border-sky-500/20 bg-sky-500/5 px-4 py-3 text-sm text-sky-300">
                    Loading alerts...
                </div>
            )}

            {error && (
                <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
                    {error}
                </div>
            )}

            {!loading && !error && (
                <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#07111f]">
                    {alerts.length > 0 ? (
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                                    <th className="px-5 py-3 font-medium">Alert</th>
                                    <th className="px-5 py-3 font-medium">Source</th>
                                    <th className="px-5 py-3 font-medium">Severity</th>
                                    <th className="px-5 py-3 font-medium">Status</th>
                                    <th className="px-5 py-3 font-medium">Assigned To</th>
                                    <th className="px-5 py-3 font-medium">Detected</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-800">
                                {alerts.map((alert) => (
                                    <tr
                                        key={alert._id}
                                        className="transition hover:bg-slate-900/40"
                                    >
                                        <td className="px-5 py-4">
                                            <p className="font-medium text-slate-200">
                                                {alert.title}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                {alert.alertType?.replaceAll("_", " ")}
                                            </p>
                                        </td>

                                        <td className="px-5 py-4 font-mono text-xs text-slate-400">
                                            {alert.sourceIp || "—"}
                                            {alert.username && (
                                                <p className="mt-1 text-slate-600">
                                                    {alert.username}
                                                </p>
                                            )}
                                        </td>

                                        <td className="px-5 py-4">
                                            <span
                                                className={`inline-flex rounded-md border px-2 py-1 text-[10px] font-bold ${
                                                    severityStyles[alert.severity] ||
                                                    "text-slate-400 bg-slate-500/10 border-slate-500/20"
                                                }`}
                                            >
                                                {alert.severity}
                                            </span>
                                        </td>

                                        <td className="px-5 py-4">
                                            <span
                                                className={`inline-flex rounded-md border px-2 py-1 text-[10px] font-bold ${
                                                    statusStyles[alert.status] ||
                                                    "text-slate-400 bg-slate-500/10 border-slate-500/20"
                                                }`}
                                            >
                                                {alert.status?.replaceAll("_", " ")}
                                            </span>
                                        </td>

                                        <td className="px-5 py-4 text-xs text-slate-400">
                                            {alert.assignedTo?.name || "Unassigned"}
                                        </td>

                                        <td className="px-5 py-4 font-mono text-xs text-slate-500">
                                            {alert.detectedAt
                                                ? new Date(alert.detectedAt).toLocaleString()
                                                : "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="py-12 text-center text-sm text-slate-500">
                            No alerts found.
                        </div>
                    )}
                </div>
            )}
        </>
    );
}

export default Alerts;