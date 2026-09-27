import { useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";
import api from "../api/axios";

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem("cybersentinel_user");

        if (!storedUser) {
            return null;
        }

        try {
            return JSON.parse(storedUser);
        } catch {
            localStorage.removeItem("cybersentinel_user");
            return null;
        }
    });

    const [loading] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("cybersentinel_token");

        if (!token) {
            return;
        }

        const storedUser = localStorage.getItem("cybersentinel_user");

        if (!storedUser) {
            localStorage.removeItem("cybersentinel_token");
        }
    }, []);

    const login = async (email, password) => {
        const response = await api.post("/auth/login", {
            email,
            password,
        });

        const { token, user: loggedInUser } = response.data;

        localStorage.setItem("cybersentinel_token", token);

        localStorage.setItem(
            "cybersentinel_user",
            JSON.stringify(loggedInUser)
        );

        setUser(loggedInUser);

        return response.data;
    };

    const logout = () => {
        localStorage.removeItem("cybersentinel_token");
        localStorage.removeItem("cybersentinel_user");

        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                login,
                logout,
                loading,
                isAuthenticated: Boolean(user),
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}