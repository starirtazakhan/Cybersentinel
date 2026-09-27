import { useEffect, useMemo, useState } from "react";
import {
    Users as UsersIcon,
    Search,
    RefreshCw,
    ShieldCheck,
    Shield,
    Eye,
    UserCheck,
    UserX
} from "lucide-react";

import api from "../api/axios";
import { useAuth } from "../context/useAuth";

const roleStyles = {
    ADMIN: "text-red-400 bg-red-500/10 border-red-500/20",
    ANALYST: "text-sky-400 bg-sky-500/10 border-sky-500/20",
    VIEWER: "text-slate-300 bg-slate-500/10 border-slate-500/20"
};

const roleIcons = {
    ADMIN: ShieldCheck,
    ANALYST: Shield,
    VIEWER: Eye
};

function Users() {
    const { user } = useAuth();

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("ALL");
    const [statusFilter, setStatusFilter] = useState("ALL");

    const loadUsers = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/users");

            setUsers(response.data.users || []);
        } catch (err) {
            console.error("Users loading error:", err);

            setError(
                err.response?.data?.message ||
                "Unable to load users."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let cancelled = false;

        const initialLoad = async () => {
            try {
                setError("");

                const response = await api.get("/users");

                if (cancelled) return;

                setUsers(response.data.users || []);
            } catch (err) {
                if (cancelled) return;

                console.error("Users loading error:", err);

                setError(
                    err.response?.data?.message ||
                    "Unable to load users."
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

    const filteredUsers = useMemo(() => {
        const query = search.trim().toLowerCase();

        return users.filter((item) => {
            const matchesSearch =
                !query ||
                item.name?.toLowerCase().includes(query) ||
                item.email?.toLowerCase().includes(query);

            const matchesRole =
                roleFilter === "ALL" ||
                item.role === roleFilter;

            const matchesStatus =
                statusFilter === "ALL" ||
                (statusFilter === "ACTIVE" && item.isActive) ||
                (statusFilter === "INACTIVE" && !item.isActive);

            return (
                matchesSearch &&
                matchesRole &&
                matchesStatus
            );
        });
    }, [users, search, roleFilter, statusFilter]);

    const statistics = useMemo(() => {
        return {
            total: users.length,
            admins: users.filter((item) => item.role === "ADMIN").length,
            analysts: users.filter((item) => item.role === "ANALYST").length,
            viewers: users.filter((item) => item.role === "VIEWER").length,
            active: users.filter((item) => item.isActive).length,
            inactive: users.filter((item) => !item.isActive).length
        };
    }, [users]);

    if (user?.role !== "ADMIN") {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="max-w-md rounded-2xl border border-red-500/20 bg-[#07111f] p-8 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
                        <ShieldCheck className="h-7 w-7 text-red-400" />
                    </div>

                    <h2 className="mt-5 text-lg font-semibold text-white">
                        Administrator Access Required
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                        User management is restricted to CyberSentinel
                        administrators.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-500/20 bg-sky-500/10">
                            <UsersIcon className="h-5 w-5 text-sky-400" />
                        </div>

                        <div>
                            <h1 className="text-xl font-semibold text-white">
                                User Management
                            </h1>

                            <p className="mt-1 text-sm text-slate-500">
                                Manage CyberSentinel analysts, administrators,
                                and viewers.
                            </p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={loadUsers}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-sky-500/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <RefreshCw
                        className={`h-4 w-4 ${
                            loading ? "animate-spin" : ""
                        }`}
                    />

                    Refresh
                </button>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-6">

                <MiniStat
                    label="Total Users"
                    value={statistics.total}
                    icon={UsersIcon}
                />

                <MiniStat
                    label="Administrators"
                    value={statistics.admins}
                    icon={ShieldCheck}
                />

                <MiniStat
                    label="Analysts"
                    value={statistics.analysts}
                    icon={Shield}
                />

                <MiniStat
                    label="Viewers"
                    value={statistics.viewers}
                    icon={Eye}
                />

                <MiniStat
                    label="Active"
                    value={statistics.active}
                    icon={UserCheck}
                />

                <MiniStat
                    label="Inactive"
                    value={statistics.inactive}
                    icon={UserX}
                />

            </div>

            {/* Filters */}
            <div className="rounded-2xl border border-slate-800 bg-[#07111f] p-4">
                <div className="flex flex-col gap-3 xl:flex-row">

                    {/* Search */}
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />

                        <input
                            type="text"
                            value={search}
                            onChange={(e) =>
                                setSearch(e.target.value)
                            }
                            placeholder="Search users by name or email..."
                            className="w-full rounded-xl border border-slate-800 bg-[#020817] py-2.5 pl-10 pr-4 text-sm text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-sky-500/40"
                        />
                    </div>

                    {/* Role filter */}
                    <select
                        value={roleFilter}
                        onChange={(e) =>
                            setRoleFilter(e.target.value)
                        }
                        className="rounded-xl border border-slate-800 bg-[#020817] px-4 py-2.5 text-sm text-slate-300 outline-none focus:border-sky-500/40"
                    >
                        <option value="ALL">
                            All Roles
                        </option>

                        <option value="ADMIN">
                            Administrators
                        </option>

                        <option value="ANALYST">
                            Analysts
                        </option>

                        <option value="VIEWER">
                            Viewers
                        </option>
                    </select>

                    {/* Status filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) =>
                            setStatusFilter(e.target.value)
                        }
                        className="rounded-xl border border-slate-800 bg-[#020817] px-4 py-2.5 text-sm text-slate-300 outline-none focus:border-sky-500/40"
                    >
                        <option value="ALL">
                            All Status
                        </option>

                        <option value="ACTIVE">
                            Active
                        </option>

                        <option value="INACTIVE">
                            Inactive
                        </option>
                    </select>

                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                    {error}
                </div>
            )}

            {/* Users table */}
            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#07111f]">

                <div className="border-b border-slate-800 px-5 py-4">
                    <div className="flex items-center justify-between">

                        <div>
                            <h2 className="font-semibold text-white">
                                Security Team
                            </h2>

                            <p className="mt-1 text-xs text-slate-500">
                                {filteredUsers.length} user
                                {filteredUsers.length !== 1 ? "s" : ""} shown
                            </p>
                        </div>

                        <div className="rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-1.5 text-xs text-slate-500">
                            ADMIN ONLY
                        </div>

                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <RefreshCw className="h-6 w-6 animate-spin text-sky-400" />
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="py-20 text-center">
                        <UsersIcon className="mx-auto h-8 w-8 text-slate-700" />

                        <p className="mt-3 text-sm text-slate-500">
                            No users found.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">

                            <thead>
                                <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-600">
                                    <th className="px-5 py-4">
                                        User
                                    </th>

                                    <th className="px-5 py-4">
                                        Role
                                    </th>

                                    <th className="px-5 py-4">
                                        Status
                                    </th>

                                    <th className="px-5 py-4">
                                        Created
                                    </th>

                                    <th className="px-5 py-4">
                                        User ID
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-800/70">

                                {filteredUsers.map((item) => {
                                    const RoleIcon =
                                        roleIcons[item.role] || Eye;

                                    return (
                                        <tr
                                            key={item._id}
                                            className="transition hover:bg-slate-900/40"
                                        >

                                            {/* User */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">

                                                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-xs font-semibold text-sky-400">
                                                        {item.name
                                                            ?.charAt(0)
                                                            ?.toUpperCase()}
                                                    </div>

                                                    <div>
                                                        <p className="text-sm font-medium text-white">
                                                            {item.name}
                                                        </p>

                                                        <p className="mt-1 text-xs text-slate-500">
                                                            {item.email}
                                                        </p>
                                                    </div>

                                                </div>
                                            </td>

                                            {/* Role */}
                                            <td className="px-5 py-4">
                                                <span
                                                    className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
                                                        roleStyles[item.role] ||
                                                        roleStyles.VIEWER
                                                    }`}
                                                >
                                                    <RoleIcon className="h-3.5 w-3.5" />

                                                    {item.role}
                                                </span>
                                            </td>

                                            {/* Status */}
                                            <td className="px-5 py-4">
                                                {item.isActive ? (
                                                    <span className="inline-flex items-center gap-2 text-xs font-medium text-emerald-400">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-500">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                                                        Inactive
                                                    </span>
                                                )}
                                            </td>

                                            {/* Created */}
                                            <td className="px-5 py-4 text-xs text-slate-500">
                                                {formatDate(item.createdAt)}
                                            </td>

                                            {/* ID */}
                                            <td className="px-5 py-4">
                                                <span className="font-mono text-[10px] text-slate-600">
                                                    {item._id}
                                                </span>
                                            </td>

                                        </tr>
                                    );
                                })}

                            </tbody>

                        </table>
                    </div>
                )}

            </div>
        </div>
    );
}

function MiniStat({ label, value, icon: Icon }) {
    return (
        <div className="rounded-2xl border border-slate-800 bg-[#07111f] p-4">

            <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">
                    {label}
                </span>

                <Icon className="h-4 w-4 text-slate-600" />
            </div>

            <p className="mt-3 text-2xl font-semibold text-white">
                {value}
            </p>

        </div>
    );
}

function formatDate(date) {
    if (!date) return "—";

    return new Date(date).toLocaleString([], {
        year: "numeric",
        month: "short",
        day: "2-digit"
    });
}

export default Users;
