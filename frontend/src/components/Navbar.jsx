import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { user, logout } = useAuth();

    return (
        <header>
            <nav className="container">
                <Link to="/" className="logo">CollegeHub</Link>
                <ul>
                    <li><Link to="/">Home</Link></li>
                    <li><Link to="/notes">Notes</Link></li>
                    <li><Link to="/about">About</Link></li>
                    <li><Link to="/feedback">Feedback</Link></li>

                    {user.loggedIn ? (
                        <>
                            <li><Link to="/upload">Upload Notes</Link></li>
                            <li><Link to="/profile">Profile</Link></li>
                            {user.role === 'admin' && (
                                <li><Link to="/admin">Admin</Link></li>
                            )}
                            <li>
                                <button onClick={logout} className="nav-link-btn" style={{ fontWeight: 'bold' }}>
                                    Logout
                                </button>
                            </li>
                            <li className="nav-user">Welcome, {user.name}!</li>
                        </>
                    ) : (
                        <li>
                            <Link to="/login" className="login-btn">Login / Register</Link>
                        </li>
                    )}
                </ul>
            </nav>
        </header>
    );
}
