import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState({ loggedIn: false });
    const [loading, setLoading] = useState(true);

    const refreshUser = async () => {
        try {
            const data = await api.getUserStatus();
            setUser(data);
        } catch (err) {
            console.error('Failed to get user status:', err);
            setUser({ loggedIn: false });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshUser();
    }, []);

    const login = async (usn, password) => {
        await api.login(usn, password);
        await refreshUser();
    };

    const register = async (name, usn, password) => {
        return await api.register(name, usn, password);
    };

    const logout = async () => {
        try {
            await api.logout();
        } finally {
            setUser({ loggedIn: false });
            window.location.href = '/';
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, refreshUser, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
