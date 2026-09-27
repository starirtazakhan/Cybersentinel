import { useEffect, useMemo, useState } from "react";
import {
    Activity,
    Search,
    RefreshCw,
    ChevronDown,
    X,
} from "lucide-react";

import api from "../api/axios";

const severityStyles = {
    CRITICAL: "text-red-400 bg-red-500/10 border-red-500/20",
    HIGH: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    MEDIUM: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    LOW: "text-sky-400 bg-sky-500/10 border-sky-500/20",
};

function Events() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [severityFilter, setSeverityFilter] = useState("ALL");

    const [selectedEvent, setSelectedEvent] = useState(null);

    const loadEvents = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/events");

            setEvents(response.data.events || []);
        } catch (err) {
            console.error("Events loading error:", err);

            setError(
                err.response?.data?.message ||
                "Unable to load security events."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
    let cancelled = false;

    const initialLoad = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/events");

            if (cancelled) {
                return;
            }

            setEvents(response.data.events || []);
        } catch (err) {
            if (cancelled) {
                return;
            }

            console.error("Events loading error:", err);

            setError(
                err.response?.data?.message ||
                "Unable to load security events."
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

    const filteredEvents = useMemo(() => {
        const query = search.trim().toLowerCase();

        return events.filter((event) => {
            const matchesSeverity =
                severityFilter === "ALL" ||
                event.severity === severityFilter;

            const matchesSearch =
                !query ||
                event.eventType?.toLowerCase().includes(query) ||
                event.source?.toLowerCase().includes(query) ||
                event.sourceIp?.toLowerCase().includes(query) ||
                event.destinationIp?.toLowerCase().includes(query) ||
                event.username?.toLowerCase().includes(query) ||
                event.description?.toLowerCase().includes(query);

            return matchesSeverity && matchesSearch;
        });
    }, [events, search, severityFilter]);

    return (
        <div>
            {/* Page heading */}
            <div className="mb-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/10 ring-1 ring-sky-500/30">
                        <Activity className="h-5 w-5 text-sky-400" />
                    </div>

                    <div>
                        <h3 className="text-2xl font-bold text-white">
                            Security Events
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                            {filteredEvents.length} event
                            {filteredEvents.length === 1 ? "" : "s"} displayed
                        </p>
                    </div>
                </div>

                <button
                    onClick={loadEvents}
                    disabled={loading}
                    className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-300 transition hover:border-sky-500/30 hover:text-sky-400 disabled:opacity-50"
                >
                    <RefreshCw
                        size={15}
                        className={loading ? "animate-spin" : ""}
                    />
                    Refresh
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-300">
                    {error}
                </div>
            )}

            {/* Filters */}
            <div className="mb-5 rounded-2xl border border-slate-800 bg-[#07111f] p-4">
                <div className="flex flex-col gap-3 lg:flex-row">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search
                            size={17}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
                        />

                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search events, IPs, sources, users..."
                            className="w-full rounded-lg border border-slate-800 bg-slate-950/60 py-2.5 pl-10 pr-4 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-sky-500/40"
                        />
                    </div>

                    {/* Severity */}
                    <div className="relative">
                        <select
                            value={severityFilter}
                            onChange={(e) =>
                                setSeverityFilter(e.target.value)
                            }
                            className="appearance-none rounded-lg border border-slate-800 bg-slate-950/60 py-2.5 pl-3 pr-10 text-sm text-slate-300 outline-none focus:border-sky-500/40"
                        >
                            <option value="ALL">All Severities</option>
                            <option value="CRITICAL">Critical</option>
                            <option value="HIGH">High</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="LOW">Low</option>
                        </select>

                        <ChevronDown
                            size={15}
                            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-600"
                        />
                    </div>
                </div>
            </div>

            {/* Events table */}
            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#07111f]">
                {loading ? (
                    <div className="py-16 text-center text-sm text-sky-300">
                        Loading security events...
                    </div>
                ) : filteredEvents.length === 0 ? (
                    <div className="py-16 text-center">
                        <Activity className="mx-auto h-8 w-8 text-slate-700" />

                        <p className="mt-3 text-sm text-slate-500">
                            No security events found.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1000px] text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                                    <th className="px-5 py-3 font-medium">
                                        Time
                                    </th>

                                    <th className="px-5 py-3 font-medium">
                                        Event Type
                                    </th>

                                    <th className="px-5 py-3 font-medium">
                                        Source
                                    </th>

                                    <th className="px-5 py-3 font-medium">
                                        Source IP
                                    </th>

                                    <th className="px-5 py-3 font-medium">
                                        Username
                                    </th>

                                    <th className="px-5 py-3 font-medium">
                                        Severity
                                    </th>

                                    <th className="px-5 py-3 font-medium">
                                        Description
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-800">
                                {filteredEvents.map((event) => (
                                    <tr
                                        key={event._id}
                                        onClick={() =>
                                            setSelectedEvent(event)
                                        }
                                        className="cursor-pointer transition hover:bg-slate-900/50"
                                    >
                                        <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                                            {event.createdAt
                                                ? new Date(
                                                      event.createdAt
                                                  ).toLocaleString()
                                                : "—"}
                                        </td>

                                        <td className="px-5 py-4">
                                            <span className="font-mono text-xs font-medium text-sky-400">
                                                {event.eventType || "—"}
                                            </span>
                                        </td>

                                        <td className="px-5 py-4 text-xs text-slate-300">
                                            {event.source || "—"}
                                        </td>

                                        <td className="px-5 py-4 font-mono text-xs text-slate-400">
                                            {event.sourceIp || "—"}
                                        </td>

                                        <td className="px-5 py-4 text-xs text-slate-400">
                                            {event.username || "—"}
                                        </td>

                                        <td className="px-5 py-4">
                                            <span
                                                className={`inline-flex rounded-md border px-2 py-1 text-[10px] font-bold ${
                                                    severityStyles[
                                                        event.severity
                                                    ] ||
                                                    "border-slate-500/20 bg-slate-500/10 text-slate-400"
                                                }`}
                                            >
                                                {event.severity || "UNKNOWN"}
                                            </span>
                                        </td>

                                        <td className="max-w-xs truncate px-5 py-4 text-xs text-slate-400">
                                            {event.description || "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Event details modal */}
            {selectedEvent && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
                    onClick={() => setSelectedEvent(null)}
                >
                    <div
                        className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-[#07111f] shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
                            <div>
                                <h4 className="font-semibold text-white">
                                    Event Details
                                </h4>

                                <p className="mt-1 font-mono text-xs text-slate-600">
                                    {selectedEvent._id}
                                </p>
                            </div>

                            <button
                                onClick={() => setSelectedEvent(null)}
                                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-800 hover:text-slate-200"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2">
                            <Detail
                                label="Event Type"
                                value={selectedEvent.eventType}
                            />

                            <Detail
                                label="Source"
                                value={selectedEvent.source}
                            />

                            <Detail
                                label="Source IP"
                                value={selectedEvent.sourceIp}
                            />

                            <Detail
                                label="Destination IP"
                                value={selectedEvent.destinationIp}
                            />

                            <Detail
                                label="Username"
                                value={selectedEvent.username}
                            />

                            <Detail
                                label="Severity"
                                value={selectedEvent.severity}
                            />

                            <div className="sm:col-span-2">
                                <Detail
                                    label="Description"
                                    value={selectedEvent.description}
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <p className="mb-2 text-xs uppercase tracking-wider text-slate-600">
                                    Metadata
                                </p>

                                <pre className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950/70 p-4 text-xs text-slate-400">
                                    {JSON.stringify(
                                        selectedEvent.metadata || {},
                                        null,
                                        2
                                    )}
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function Detail({ label, value }) {
    return (
        <div>
            <p className="text-xs uppercase tracking-wider text-slate-600">
                {label}
            </p>

            <p className="mt-1 text-sm text-slate-300">
                {value || "—"}
            </p>
        </div>
    );
}

export default Events; 
