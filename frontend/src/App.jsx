import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

// Pages
import Home from './pages/Home';
import About from './pages/About';
import Feedback from './pages/Feedback';
import Login from './pages/Login';
import Notes from './pages/Notes';
import NoteDetail from './pages/NoteDetail';
import UploadNote from './pages/UploadNote';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';

function NotFound() {
    return (
        <main className="container page-padding" style={{ textAlign: 'center' }}>
            <h1 className="page-title">404 - Page Not Found</h1>
            <p className="page-subtitle">The page you are looking for does not exist.</p>
            <Link to="/" className="cta-button" style={{ display: 'inline-block' }}>
                Back to Home
            </Link>
        </main>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Navbar />
                <Routes>
                    {/* Public Routes - supporting both clean paths and legacy .html URLs */}
                    <Route path="/" element={<Home />} />
                    <Route path="/index.html" element={<Home />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/about.html" element={<About />} />
                    <Route path="/feedback" element={<Feedback />} />
                    <Route path="/feedback.html" element={<Feedback />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/login.html" element={<Login />} />

                    {/* Authenticated Routes */}
                    <Route
                        path="/notes"
                        element={
                            <ProtectedRoute>
                                <Notes />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/notes.html"
                        element={
                            <ProtectedRoute>
                                <Notes />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/notes/:id"
                        element={
                            <ProtectedRoute>
                                <NoteDetail />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/note-detail.html"
                        element={
                            <ProtectedRoute>
                                <NoteDetail />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/upload"
                        element={
                            <ProtectedRoute>
                                <UploadNote />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/upload.html"
                        element={
                            <ProtectedRoute>
                                <UploadNote />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/profile"
                        element={
                            <ProtectedRoute>
                                <Profile />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/profile.html"
                        element={
                            <ProtectedRoute>
                                <Profile />
                            </ProtectedRoute>
                        }
                    />

                    {/* Admin Route */}
                    <Route
                        path="/admin"
                        element={
                            <AdminRoute>
                                <AdminDashboard />
                            </AdminRoute>
                        }
                    />
                    <Route
                        path="/admin.html"
                        element={
                            <AdminRoute>
                                <AdminDashboard />
                            </AdminRoute>
                        }
                    />

                    {/* Fallback */}
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}
