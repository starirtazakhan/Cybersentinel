import { useState } from "react";
import {
    Activity,
    Eye,
    EyeOff,
    LockKeyhole,
    Shield,
    User,
} from "lucide-react";
import { useAuth } from "./context/useAuth";

function Login() {
    const { login } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError("");
        setLoading(true);

        try {
            await login(email, password);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to authenticate. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#020817] text-slate-200">
            <div className="flex min-h-screen">

                {/* LEFT PANEL */}
                <div className="relative hidden overflow-hidden border-r border-slate-800/80 bg-[#040c18] lg:flex lg:w-[55%]">

                    {/* Grid */}
                    <div className="absolute inset-0 opacity-30">
                        <div className="h-full w-full bg-[linear-gradient(rgba(56,189,248,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.08)_1px,transparent_1px)] bg-[size:50px_50px]" />
                    </div>

                    {/* Glow */}
                    <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-500/10 blur-[120px]" />

                    <div className="relative z-10 flex w-full flex-col justify-between p-12">

                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/10 ring-1 ring-sky-400/30">
                                <Shield className="h-6 w-6 text-sky-400" />
                            </div>

                            <div>
                                <p className="font-bold tracking-wide text-white">
                                    CYBERSENTINEL
                                </p>
                                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                                    Security Operations Platform
                                </p>
                            </div>
                        </div>

                        <div className="max-w-xl">

                            <div className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-emerald-400">
                                <Activity size={14} />
                                Security Operations Center
                            </div>

                            <h1 className="text-5xl font-bold leading-tight text-white">
                                Defend your
                                <span className="text-sky-400">
                                    {" "}digital environment.
                                </span>
                            </h1>

                            <p className="mt-6 max-w-lg text-base leading-7 text-slate-500">
                                Monitor security events, investigate alerts,
                                prioritize incidents and understand your
                                organization's threat landscape from one
                                centralized security operations platform.
                            </p>

                            <div className="mt-8 flex gap-8">
                                <Feature
                                    title="Live Monitoring"
                                    value="24/7"
                                />

                                <Feature
                                    title="Threat Visibility"
                                    value="Real-time"
                                />

                                <Feature
                                    title="Risk Analysis"
                                    value="Automated"
                                />
                            </div>
                        </div>

                        <p className="text-xs text-slate-700">
                            CYBERSENTINEL SOC PLATFORM • SECURE OPERATIONS
                        </p>
                    </div>
                </div>

                {/* LOGIN PANEL */}
                <div className="flex flex-1 items-center justify-center px-6 py-12">

                    <div className="w-full max-w-md">

                        <div className="mb-8 lg:hidden">
                            <div className="flex items-center gap-3">
                                <Shield className="text-sky-400" />
                                <span className="font-bold text-white">
                                    CYBERSENTINEL
                                </span>
                            </div>
                        </div>

                        <div className="mb-8">
                            <h2 className="text-3xl font-bold text-white">
                                Welcome back
                            </h2>

                            <p className="mt-2 text-sm text-slate-500">
                                Sign in to access the security operations
                                center.
                            </p>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="space-y-5"
                        >

                            {/* EMAIL */}
                            <div>
                                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                                    Email address
                                </label>

                                <div className="flex items-center rounded-xl border border-slate-800 bg-slate-900/50 px-4 transition focus-within:border-sky-500/50">
                                    <User
                                        size={18}
                                        className="text-slate-600"
                                    />

                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) =>
                                            setEmail(e.target.value)
                                        }
                                        placeholder="analyst@company.com"
                                        className="w-full bg-transparent px-3 py-3.5 text-sm text-white outline-none placeholder:text-slate-700"
                                    />
                                </div>
                            </div>

                            {/* PASSWORD */}
                            <div>
                                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                                    Password
                                </label>

                                <div className="flex items-center rounded-xl border border-slate-800 bg-slate-900/50 px-4 transition focus-within:border-sky-500/50">
                                    <LockKeyhole
                                        size={18}
                                        className="text-slate-600"
                                    />

                                    <input
                                        type={
                                            showPassword
                                                ? "text"
                                                : "password"
                                        }
                                        required
                                        value={password}
                                        onChange={(e) =>
                                            setPassword(e.target.value)
                                        }
                                        placeholder="••••••••"
                                        className="w-full bg-transparent px-3 py-3.5 text-sm text-white outline-none placeholder:text-slate-700"
                                    />

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword(!showPassword)
                                        }
                                        className="text-slate-600 transition hover:text-slate-300"
                                    >
                                        {showPassword ? (
                                            <EyeOff size={18} />
                                        ) : (
                                            <Eye size={18} />
                                        )}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="flex w-full items-center justify-center rounded-xl bg-sky-500 py-3.5 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {loading
                                    ? "Authenticating..."
                                    : "Sign in to SOC"}
                            </button>
                        </form>

                        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            SOC services operational
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Feature({ title, value }) {
    return (
        <div>
            <p className="text-lg font-semibold text-white">
                {value}
            </p>
            <p className="mt-1 text-xs text-slate-600">
                {title}
            </p>
        </div>
    );
}

export default Login;