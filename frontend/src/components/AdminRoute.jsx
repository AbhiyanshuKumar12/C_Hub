import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <main className="container page-padding">
                <p style={{ textAlign: 'center' }}>Loading...</p>
            </main>
        );
    }

    if (!user.loggedIn) {
        return <Navigate to="/login" replace />;
    }

    if (user.role !== 'admin') {
        return (
            <main className="container page-padding">
                <div className="error" style={{ textAlign: 'center', marginTop: '40px' }}>
                    <h2>403 Forbidden</h2>
                    <p>You do not have permission to access this page.</p>
                </div>
            </main>
        );
    }

    return children;
}
