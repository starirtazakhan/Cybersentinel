import { useEffect, useRef, useState } from "react";
import {
    Bell,
    ChevronDown,
    FileText,
    LayoutDashboard,
    LogOut,
    Mail,
    Menu,
    Shield,
    ShieldAlert,
    UserCircle,
    Users,
    Wifi,
    X,
    Activity,
    Target,
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

import { useAuth } from "../context/useAuth";
import api from "../api/axios";

function Layout() {
    const { user, logout } = useAuth();

    const [profileOpen, setProfileOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notificationLoading, setNotificationLoading] = useState(false);

    const notificationRef = useRef(null);
    const profileRef = useRef(null);

    const navItems = [
        {
            name: "Dashboard",
            path: "/dashboard",
            icon: LayoutDashboard,
        },
        {
            name: "Alerts",
            path: "/alerts",
            icon: ShieldAlert,
        },
        {
            name: "Incidents",
            path: "/incidents",
            icon: Target,
        },
        {
            name: "Events",
            path: "/events",
            icon: Activity,
        },
        {
            name: "Threat Intelligence",
            path: "/threat-intelligence",
            icon: Wifi,
            accent: "violet",
        },
        {
            name: "MITRE ATT&CK",
            path: "/mitre",
            icon: Shield,
            accent: "violet",
        },
        {
            name: "Reports",
            path: "/reports",
            icon: FileText,
        },
    ];

    // Admin-only navigation
    if (user?.role === "ADMIN") {
        navItems.push({
            name: "Users",
            path: "/users",
            icon: Users,
        });
    }

    const fetchNotifications = async () => {
        try {
            setNotificationLoading(true);

            const response = await api.get("/notifications");

            setNotifications(
                response.data.notifications || []
            );

            setUnreadCount(
                response.data.unreadCount || 0
            );
        } catch (error) {
            console.error(
                "Unable to load notifications:",
                error
            );
        } finally {
            setNotificationLoading(false);
        }
    };

    // Initial notification load
    useEffect(() => {
        let cancelled = false;

        const loadNotifications = async () => {
            try {
                const response =
                    await api.get("/notifications");

                if (cancelled) return;

                setNotifications(
                    response.data.notifications || []
                );

                setUnreadCount(
                    response.data.unreadCount || 0
                );
            } catch (error) {
                if (!cancelled) {
                    console.error(
                        "Unable to load notifications:",
                        error
                    );
                }
            }
        };

        loadNotifications();

        return () => {
            cancelled = true;
        };
    }, []);

    // Refresh notifications every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            fetchNotifications();
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                notificationRef.current &&
                !notificationRef.current.contains(event.target)
            ) {
                setNotificationsOpen(false);
            }

            if (
                profileRef.current &&
                !profileRef.current.contains(event.target)
            ) {
                setProfileOpen(false);
            }
        };

        document.addEventListener(
            "mousedown",
            handleClickOutside
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );
        };
    }, []);

    const getNotificationIcon = (notification) => {
        if (notification.type === "INCIDENT") {
            return <Target className="h-4 w-4" />;
        }

        if (notification.type === "EVENT") {
            return <Activity className="h-4 w-4" />;
        }

        return <ShieldAlert className="h-4 w-4" />;
    };

    const getNotificationColor = (severity) => {
        switch (severity) {
            case "CRITICAL":
                return "text-red-400 bg-red-500/10 border-red-500/20";

            case "HIGH":
                return "text-orange-400 bg-orange-500/10 border-orange-500/20";

            case "MEDIUM":
                return "text-yellow-400 bg-yellow-500/10 border-yellow-500/20";

            default:
                return "text-cyan-400 bg-cyan-500/10 border-cyan-500/20";
        }
    };

    const formatNotificationTime = (date) => {
        if (!date) return "";

        const notificationDate = new Date(date);
        const now = new Date();

        const difference =
            Math.floor(
                (now - notificationDate) / 1000
            );

        if (difference < 60) {
            return "Just now";
        }

        if (difference < 3600) {
            return `${Math.floor(
                difference / 60
            )}m ago`;
        }

        if (difference < 86400) {
            return `${Math.floor(
                difference / 3600
            )}h ago`;
        }

        return `${Math.floor(
            difference / 86400
        )}d ago`;
    };

    return (
        <div className="min-h-screen bg-[#020817] text-slate-200">

            {/* Sidebar */}
            <aside
                className={`
                    fixed inset-y-0 left-0 z-50 w-64
                    border-r border-slate-800
                    bg-[#050d1a]
                    transition-transform duration-300
                    lg:translate-x-0
                    ${
                        mobileMenuOpen
                            ? "translate-x-0"
                            : "-translate-x-full"
                    }
                `}
            >
                <div className="flex h-full flex-col">

                    {/* Logo */}
                    <div className="flex h-16 items-center justify-between border-b border-slate-800 px-5">

                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-cyan-500/10 p-2">
                                <Shield className="h-5 w-5 text-cyan-400" />
                            </div>

                            <div>
                                <p className="font-semibold text-white">
                                    CyberSentinel
                                </p>

                                <p className="text-[10px] uppercase tracking-widest text-slate-500">
                                    SOC Platform
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() =>
                                setMobileMenuOpen(false)
                            }
                            className="text-slate-500 hover:text-white lg:hidden"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 space-y-1 overflow-y-auto p-3">

                        <p className="mb-3 px-3 pt-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
                            Security Operations
                        </p>

                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const accent = item.accent || "cyan";

                            const activeClasses =
                                accent === "violet"
                                    ? "bg-violet-500/10 text-violet-400"
                                    : "bg-cyan-500/10 text-cyan-400";

                            return (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    onClick={() =>
                                        setMobileMenuOpen(false)
                                    }
                                    className={({ isActive }) =>
                                        `
                                        flex items-center gap-3
                                        rounded-lg px-3 py-2.5
                                        text-sm transition
                                        ${
                                            isActive
                                                ? activeClasses
                                                : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
                                        }
                                        `
                                    }
                                >
                                    <Icon className="h-4 w-4 shrink-0" />
                                    <span>{item.name}</span>
                                </NavLink>
                            );
                        })}
                    </nav>

                    {/* Bottom user section */}
                    <div className="border-t border-slate-800 p-3">

                        <div className="mb-2 flex items-center gap-3 rounded-lg bg-slate-900/60 p-3">

                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-sm font-semibold text-cyan-400">
                                {user?.name
                                    ?.charAt(0)
                                    ?.toUpperCase() || "U"}
                            </div>

                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-white">
                                    {user?.name || "User"}
                                </p>

                                <p className="truncate text-xs text-slate-500">
                                    {user?.role || "VIEWER"}
                                </p>
                            </div>

                        </div>

                        <button
                            onClick={logout}
                            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-400 transition hover:bg-red-500/10 hover:text-red-400"
                        >
                            <LogOut className="h-4 w-4" />
                            Sign Out
                        </button>

                    </div>
                </div>
            </aside>

            {/* Mobile overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/60 lg:hidden"
                    onClick={() =>
                        setMobileMenuOpen(false)
                    }
                />
            )}

            {/* Main */}
            <div className="lg:pl-64">

                {/* Top Bar */}
                <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-800 bg-[#020817]/95 px-4 backdrop-blur md:px-6">

                    {/* Mobile menu */}
                    <button
                        onClick={() =>
                            setMobileMenuOpen(true)
                        }
                        className="text-slate-400 hover:text-white lg:hidden"
                    >
                        <Menu className="h-5 w-5" />
                    </button>

                    <div className="hidden lg:block">
                        <p className="text-xs uppercase tracking-widest text-slate-500">
                            Security Operations Center
                        </p>
                    </div>

                    <div className="ml-auto flex items-center gap-2">

                        {/* Notifications */}
                        <div
                            ref={notificationRef}
                            className="relative"
                        >
                            <button
                                onClick={() => {
                                    setNotificationsOpen(
                                        !notificationsOpen
                                    );

                                    if (
                                        !notificationsOpen
                                    ) {
                                        fetchNotifications();
                                    }
                                }}
                                className="relative rounded-lg p-2.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                                aria-label="Notifications"
                            >
                                <Bell className="h-5 w-5" />

                                {unreadCount > 0 && (
                                    <>
                                        <span className="absolute right-2 top-2 h-2 w-2 animate-pulse rounded-full bg-red-500" />

                                        <span className="absolute -right-1 -top-1 flex min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                                            {unreadCount > 99
                                                ? "99+"
                                                : unreadCount}
                                        </span>
                                    </>
                                )}
                            </button>

                            {/* Notification dropdown */}
                            {notificationsOpen && (
                                <div className="absolute right-0 top-12 w-[380px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-slate-700 bg-[#07111f] shadow-2xl shadow-black/40">

                                    {/* Header */}
                                    <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">

                                        <div>
                                            <h3 className="text-sm font-semibold text-white">
                                                Notifications
                                            </h3>

                                            <p className="text-xs text-slate-500">
                                                Recent security activity
                                            </p>
                                        </div>

                                        {unreadCount > 0 && (
                                            <span className="rounded-full bg-red-500/10 px-2 py-1 text-[10px] font-medium text-red-400">
                                                {unreadCount} active
                                            </span>
                                        )}

                                    </div>

                                    {/* Notifications */}
                                    <div className="max-h-[420px] overflow-y-auto">

                                        {notificationLoading ? (
                                            <div className="flex items-center justify-center px-4 py-10 text-sm text-slate-500">
                                                Loading notifications...
                                            </div>
                                        ) : notifications.length ===
                                          0 ? (
                                            <div className="px-4 py-10 text-center">

                                                <Bell className="mx-auto mb-3 h-7 w-7 text-slate-700" />

                                                <p className="text-sm text-slate-400">
                                                    No security notifications
                                                </p>

                                                <p className="mt-1 text-xs text-slate-600">
                                                    You're all caught up.
                                                </p>

                                            </div>
                                        ) : (
                                            notifications.map(
                                                (
                                                    notification
                                                ) => (
                                                    <div
                                                        key={
                                                            notification.id
                                                        }
                                                        className="border-b border-slate-800/70 px-4 py-3 transition hover:bg-slate-800/40"
                                                    >
                                                        <div className="flex gap-3">

                                                            <div
                                                                className={`
                                                                    flex h-9 w-9 shrink-0
                                                                    items-center justify-center
                                                                    rounded-lg border
                                                                    ${getNotificationColor(
                                                                        notification.severity
                                                                    )}
                                                                `}
                                                            >
                                                                {getNotificationIcon(
                                                                    notification
                                                                )}
                                                            </div>

                                                            <div className="min-w-0 flex-1">

                                                                <div className="flex items-start justify-between gap-2">

                                                                    <div>
                                                                        <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-600">
                                                                            {
                                                                                notification.type
                                                                            }
                                                                        </span>

                                                                        <p className="mt-0.5 line-clamp-1 text-sm font-medium text-slate-200">
                                                                            {
                                                                                notification.title
                                                                            }
                                                                        </p>
                                                                    </div>

                                                                    {notification.severity && (
                                                                        <span
                                                                            className={`shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-semibold ${getNotificationColor(
                                                                                notification.severity
                                                                            )}`}
                                                                        >
                                                                            {
                                                                                notification.severity
                                                                            }
                                                                        </span>
                                                                    )}

                                                                </div>

                                                                <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                                                                    {
                                                                        notification.message
                                                                    }
                                                                </p>

                                                                <div className="mt-2 flex items-center justify-between">

                                                                    {notification.sourceIp ? (
                                                                        <span className="font-mono text-[10px] text-slate-600">
                                                                            {
                                                                                notification.sourceIp
                                                                            }
                                                                        </span>
                                                                    ) : (
                                                                        <span />
                                                                    )}

                                                                    <span className="text-[10px] text-slate-600">
                                                                        {formatNotificationTime(
                                                                            notification.createdAt
                                                                        )}
                                                                    </span>

                                                                </div>

                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            )
                                        )}

                                    </div>

                                    {/* Footer */}
                                    <div className="border-t border-slate-800 p-3">

                                        <NavLink
                                            to="/alerts"
                                            onClick={() =>
                                                setNotificationsOpen(
                                                    false
                                                )
                                            }
                                            className="flex items-center justify-center gap-2 rounded-lg bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-400 transition hover:bg-cyan-500/20"
                                        >
                                            <ShieldAlert className="h-3.5 w-3.5" />
                                            View Security Alerts
                                        </NavLink>

                                    </div>

                                </div>
                            )}
                        </div>

                        {/* Profile */}
                        <div
                            ref={profileRef}
                            className="relative"
                        >
                            <button
                                onClick={() =>
                                    setProfileOpen(
                                        !profileOpen
                                    )
                                }
                                className="flex items-center gap-2 rounded-lg p-1.5 transition hover:bg-slate-800"
                            >
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/10 text-sm font-semibold text-cyan-400">
                                    {user?.name
                                        ?.charAt(0)
                                        ?.toUpperCase() ||
                                        "U"}
                                </div>

                                <ChevronDown className="hidden h-4 w-4 text-slate-500 sm:block" />
                            </button>

                            {profileOpen && (
                                <div className="absolute right-0 top-11 w-64 rounded-xl border border-slate-700 bg-[#07111f] p-3 shadow-2xl">

                                    <div className="mb-3 flex items-center gap-3 border-b border-slate-800 pb-3">

                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-400">
                                            {user?.name
                                                ?.charAt(0)
                                                ?.toUpperCase() ||
                                                "U"}
                                        </div>

                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-white">
                                                {user?.name ||
                                                    "User"}
                                            </p>

                                            <p className="truncate text-xs text-slate-500">
                                                {user?.email ||
                                                    "No email"}
                                            </p>
                                        </div>

                                    </div>

                                    <div className="space-y-2 text-xs">

                                        <div className="flex items-center gap-2 text-slate-500">
                                            <UserCircle className="h-4 w-4" />
                                            <span>
                                                Role:
                                            </span>

                                            <span className="font-medium text-cyan-400">
                                                {user?.role ||
                                                    "VIEWER"}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 text-slate-500">
                                            <Mail className="h-4 w-4" />
                                            <span className="truncate">
                                                {user?.email ||
                                                    "No email"}
                                            </span>
                                        </div>

                                    </div>

                                    <button
                                        onClick={logout}
                                        className="mt-3 flex w-full items-center gap-2 rounded-lg border border-red-500/10 bg-red-500/5 px-3 py-2 text-xs text-red-400 transition hover:bg-red-500/10"
                                    >
                                        <LogOut className="h-3.5 w-3.5" />
                                        Sign Out
                                    </button>

                                </div>
                            )}
                        </div>

                    </div>
                </header>

                {/* Page */}
                <main className="p-4 md:p-6">
                    <Outlet />
                </main>

            </div>
        </div>
    );
}

export default Layout;
