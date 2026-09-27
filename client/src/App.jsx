import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { useAuth } from "./context/useAuth";
import Login from "./Login";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Alerts from "./pages/Alerts";
import Incidents from "./pages/Incidents";
import Events from "./pages/Events";
import ThreatIntelligence from "./pages/ThreatIntelligence";
import Mitre from "./pages/Mitre";
import UsersPage from "./pages/Users";
import Reports from "./pages/Reports";

function ProtectedRoute({ children }) {
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

function App() {
    const { isAuthenticated } = useAuth();

    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/login"
                    element={
                        isAuthenticated ? (
                            <Navigate to="/dashboard" replace />
                        ) : (
                            <Login />
                        )
                    }
                />

                <Route
                    element={
                        <ProtectedRoute>
                            <Layout />
                        </ProtectedRoute>
                    }
                >
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/alerts" element={<Alerts />} />
                    <Route path="/incidents" element={<Incidents />} />
                    <Route path="/events" element={<Events />} />
                    <Route
                        path="/threat-intelligence"
                        element={<ThreatIntelligence />}
                    />
                    <Route path="/mitre" element={<Mitre />} />
                    <Route path="/users" element={<UsersPage />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                </Route>

                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
