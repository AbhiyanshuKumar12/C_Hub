import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
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

    return children;
}
