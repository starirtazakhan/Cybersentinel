import { useEffect, useState } from "react";
import {
    FileText,
    RefreshCw,
    Download,
    Calendar,
    AlertTriangle,
    ShieldAlert,
    Activity,
    Target,
} from "lucide-react";

import api from "../api/axios";

function Reports() {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const fetchReport = async (showLoading = true) => {
    try {
        if (showLoading) {
            setLoading(true);
        }

        setError("");

        const params = {};

        if (startDate) {
            params.startDate = startDate;
        }

        if (endDate) {
            params.endDate = endDate;
        }

        const response = await api.get("/reports", { params });

        setReport(response.data);
    } catch (err) {
        console.error("Report loading error:", err);

        setError(
            err.response?.data?.message ||
                "Unable to load SOC report."
        );
    } finally {
        if (showLoading) {
            setLoading(false);
        }
    }
};

useEffect(() => {
    let cancelled = false;

    const loadInitialReport = async () => {
        try {
            setError("");

            const response = await api.get("/reports");

            if (cancelled) return;

            setReport(response.data);
        } catch (err) {
            if (cancelled) return;

            console.error("Report loading error:", err);

            setError(
                err.response?.data?.message ||
                    "Unable to load SOC report."
            );
        } finally {
            if (!cancelled) {
                setLoading(false);
            }
        }
    };

    loadInitialReport();

    return () => {
        cancelled = true;
    };
}, []);

    const exportCSV = () => {
        if (!report) return;

        const rows = [
            ["CyberSentinel SOC Report"],
            [],
            ["Metric", "Value"],
            ["Security Events", report.summary?.totalEvents || 0],
            ["Alerts", report.summary?.totalAlerts || 0],
            ["Incidents", report.summary?.totalIncidents || 0],
            ["Critical Alerts", report.summary?.criticalAlerts || 0],
            [],
            ["Severity", "Count"],
            ...(report.severityDistribution || []).map((item) => [
                item._id,
                item.count,
            ]),
            [],
            ["Incident Status", "Count"],
            ...(report.incidentStatusDistribution || []).map((item) => [
                item._id,
                item.count,
            ]),
        ];

        const csv = rows
            .map((row) =>
                row
                    .map((value) => `"${String(value).replace(/"/g, '""')}"`)
                    .join(",")
            )
            .join("\n");

        const blob = new Blob([csv], {
            type: "text/csv;charset=utf-8;",
        });

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = "cybersentinel-soc-report.csv";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    };

    const severityClass = (severity) => {
        switch (severity) {
            case "CRITICAL":
                return "text-red-400 bg-red-500/10 border-red-500/20";
            case "HIGH":
                return "text-orange-400 bg-orange-500/10 border-orange-500/20";
            case "MEDIUM":
                return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";
            default:
                return "text-sky-400 bg-sky-500/10 border-sky-500/20";
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[500px] items-center justify-center">
                <div className="flex items-center gap-3 text-slate-400">
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    Loading SOC report...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
                <div className="flex items-center gap-3 text-red-400">
                    <AlertTriangle className="h-5 w-5" />
                    <span>{error}</span>
                </div>

                <button
                    onClick={fetchReport}
                    className="mt-4 rounded-lg bg-sky-500/10 px-4 py-2 text-sm text-sky-400 hover:bg-sky-500/20"
                >
                    Try Again
                </button>
            </div>
        );
    }

    const summary = report?.summary || {};

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                <div>
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl border border-sky-500/20 bg-sky-500/10 p-3">
                            <FileText className="h-6 w-6 text-sky-400" />
                        </div>

                        <div>
                            <h1 className="text-2xl font-semibold text-white">
                                SOC Reports
                            </h1>

                            <p className="text-sm text-slate-400">
                                Security activity and incident analysis
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">

                    <button
                        onClick={fetchReport}
                        className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300 hover:border-sky-500/40 hover:text-white"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                    </button>

                    <button
                        onClick={exportCSV}
                        disabled={!report}
                        className="flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-400 disabled:opacity-50"
                    >
                        <Download className="h-4 w-4" />
                        Export CSV
                    </button>

                </div>
            </div>

            {/* Filters */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">

                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-300">
                    <Calendar className="h-4 w-4 text-sky-400" />
                    Report Date Range
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:items-end">

                    <div>
                        <label className="mb-1 block text-xs text-slate-500">
                            Start Date
                        </label>

                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300 outline-none focus:border-sky-500"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-xs text-slate-500">
                            End Date
                        </label>

                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-300 outline-none focus:border-sky-500"
                        />
                    </div>

                    <button
                        onClick={fetchReport}
                        className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-4 py-2 text-sm text-sky-400 hover:bg-sky-500/20"
                    >
                        Generate Report
                    </button>

                    <button
                        onClick={() => {
                            setStartDate("");
                            setEndDate("");

                            setTimeout(() => {
                                fetchReport();
                            }, 0);
                        }}
                        className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-400 hover:text-white"
                    >
                        Clear
                    </button>

                </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

                <StatCard
                    icon={<Activity className="h-5 w-5" />}
                    label="Security Events"
                    value={summary.totalEvents || 0}
                />

                <StatCard
                    icon={<ShieldAlert className="h-5 w-5" />}
                    label="Alerts"
                    value={summary.totalAlerts || 0}
                />

                <StatCard
                    icon={<Target className="h-5 w-5" />}
                    label="Incidents"
                    value={summary.totalIncidents || 0}
                />

                <StatCard
                    icon={<AlertTriangle className="h-5 w-5" />}
                    label="Critical Alerts"
                    value={summary.criticalAlerts || 0}
                />

            </div>

            {/* Main report sections */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

                {/* Severity */}
                <section className="rounded-xl border border-slate-800 bg-slate-900/60">

                    <div className="border-b border-slate-800 p-5">
                        <h2 className="font-semibold text-white">
                            Alert Severity
                        </h2>

                        <p className="mt-1 text-xs text-slate-500">
                            Distribution of alerts by severity
                        </p>
                    </div>

                    <div className="p-5">

                        {(report?.severityDistribution || []).length === 0 ? (
                            <p className="text-sm text-slate-500">
                                No severity data available.
                            </p>
                        ) : (
                            <div className="space-y-3">

                                {report.severityDistribution.map(
                                    (item) => (
                                        <div
                                            key={item._id}
                                            className="flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-3">

                                                <span
                                                    className={`rounded-md border px-2 py-1 text-xs font-medium ${severityClass(
                                                        item._id
                                                    )}`}
                                                >
                                                    {item._id}
                                                </span>

                                            </div>

                                            <span className="font-semibold text-white">
                                                {item.count}
                                            </span>
                                        </div>
                                    )
                                )}

                            </div>
                        )}

                    </div>
                </section>

                {/* Incident status */}
                <section className="rounded-xl border border-slate-800 bg-slate-900/60">

                    <div className="border-b border-slate-800 p-5">
                        <h2 className="font-semibold text-white">
                            Incident Status
                        </h2>

                        <p className="mt-1 text-xs text-slate-500">
                            Current incident lifecycle distribution
                        </p>
                    </div>

                    <div className="p-5 space-y-3">

                        {(report?.incidentStatusDistribution || []).length ===
                        0 ? (
                            <p className="text-sm text-slate-500">
                                No incident status data available.
                            </p>
                        ) : (
                            report.incidentStatusDistribution.map(
                                (item) => (
                                    <div
                                        key={item._id}
                                        className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/50 px-4 py-3"
                                    >
                                        <span className="text-sm text-slate-300">
                                            {item._id}
                                        </span>

                                        <span className="font-semibold text-white">
                                            {item.count}
                                        </span>
                                    </div>
                                )
                            )
                        )}

                    </div>
                </section>

            </div>

            {/* MITRE */}
            <section className="rounded-xl border border-slate-800 bg-slate-900/60">

                <div className="border-b border-slate-800 p-5">
                    <h2 className="font-semibold text-white">
                        MITRE ATT&CK Coverage
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                        Techniques observed during the selected period
                    </p>
                </div>

                <div className="p-5">

                    {(report?.mitreTechniques || []).length === 0 ? (
                        <p className="text-sm text-slate-500">
                            No MITRE ATT&CK techniques detected.
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">

                            {report.mitreTechniques.map(
                                (technique) => (
                                    <div
                                        key={technique.id}
                                        className="rounded-lg border border-slate-800 bg-slate-950/50 p-4"
                                    >
                                        <div className="flex items-center justify-between">

                                            <span className="font-mono text-sm text-sky-400">
                                                {technique.id}
                                            </span>

                                            <span className="text-xs text-slate-500">
                                                {technique.count} occurrence
                                                {technique.count !== 1
                                                    ? "s"
                                                    : ""}
                                            </span>

                                        </div>

                                        <p className="mt-2 text-sm font-medium text-white">
                                            {technique.name}
                                        </p>

                                        <p className="mt-1 text-xs text-slate-500">
                                            {technique.tactic}
                                        </p>
                                    </div>
                                )
                            )}

                        </div>
                    )}

                </div>
            </section>

            {/* Top source IPs */}
            <section className="rounded-xl border border-slate-800 bg-slate-900/60">

                <div className="border-b border-slate-800 p-5">
                    <h2 className="font-semibold text-white">
                        Top Source IPs
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                        Most frequently associated source addresses
                    </p>
                </div>

                <div className="overflow-x-auto">

                    <table className="w-full text-left text-sm">

                        <thead className="border-b border-slate-800 text-xs uppercase text-slate-500">
                            <tr>
                                <th className="px-5 py-3">
                                    Source IP
                                </th>

                                <th className="px-5 py-3">
                                    Events
                                </th>
                            </tr>
                        </thead>

                        <tbody>

                            {(report?.topSourceIps || []).map(
                                (item) => (
                                    <tr
                                        key={item._id}
                                        className="border-b border-slate-800/60 last:border-0"
                                    >
                                        <td className="px-5 py-3 font-mono text-sky-400">
                                            {item._id}
                                        </td>

                                        <td className="px-5 py-3 text-slate-300">
                                            {item.count}
                                        </td>
                                    </tr>
                                )
                            )}

                        </tbody>

                    </table>

                </div>
            </section>

        </div>
    );
}

function StatCard({ icon, label, value }) {
    return (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">

            <div className="flex items-center justify-between">

                <div className="rounded-lg border border-sky-500/20 bg-sky-500/10 p-2 text-sky-400">
                    {icon}
                </div>

                <span className="text-2xl font-bold text-white">
                    {value}
                </span>

            </div>

            <p className="mt-4 text-sm text-slate-400">
                {label}
            </p>

        </div>
    );
}

export default Reports;