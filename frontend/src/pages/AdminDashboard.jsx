import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import Footer from '../components/Footer';

export default function AdminDashboard() {
    const [users, setUsers] = useState([]);
    const [notes, setNotes] = useState([]);
    const [feedback, setFeedback] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState({});

    const loadDashboard = async () => {
        try {
            const [usersData, notesData, feedbackData] = await Promise.all([
                api.getAdminUsers(),
                api.getAdminNotes(),
                api.getAdminFeedback(),
            ]);
            setUsers(Array.isArray(usersData) ? usersData : []);
            setNotes(Array.isArray(notesData) ? notesData : []);
            setFeedback(Array.isArray(feedbackData) ? feedbackData : []);
        } catch (err) {
            console.error('Error loading admin dashboard:', err);
            setError('Error loading data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboard();
    }, []);

    const handleApprove = async (noteId) => {
        setActionLoading((prev) => ({ ...prev, [`approve-${noteId}`]: true }));
        try {
            const res = await api.approveAdminNote(noteId);
            if (res.success) {
                await loadDashboard();
            } else {
                alert('Failed to approve note');
            }
        } catch (err) {
            console.error('Approve error:', err);
            alert('Failed to approve note');
        } finally {
            setActionLoading((prev) => ({ ...prev, [`approve-${noteId}`]: false }));
        }
    };

    const handleDelete = async (noteId) => {
        if (!window.confirm('Are you sure you want to permanently delete this note and its reviews?')) {
            return;
        }

        setActionLoading((prev) => ({ ...prev, [`delete-${noteId}`]: true }));
        try {
            const res = await api.deleteAdminNote(noteId);
            if (res.success) {
                setNotes((prevNotes) => prevNotes.filter((n) => n.id !== noteId));
            } else {
                alert('Failed to delete note');
            }
        } catch (err) {
            console.error('Delete error:', err);
            alert('Failed to delete note');
        } finally {
            setActionLoading((prev) => ({ ...prev, [`delete-${noteId}`]: false }));
        }
    };

    return (
        <>
            <main className="container page-padding">
                <h1 className="page-title">Admin Dashboard</h1>
                <p className="page-subtitle">Welcome to the admin control panel.</p>

                {loading ? (
                    <div id="admin-content">
                        <h2>Loading data...</h2>
                    </div>
                ) : error ? (
                    <div className="error">
                        <h2>{error}</h2>
                    </div>
                ) : (
                    <div id="admin-content">
                        {/* Users Table */}
                        <section className="subject-section">
                            <h2>Registered Users ({users.length})</h2>
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Name</th>
                                        <th>USN</th>
                                        <th>Role</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((u) => (
                                        <tr key={u.id}>
                                            <td>{u.id}</td>
                                            <td>{u.name}</td>
                                            <td>{u.usn}</td>
                                            <td>{u.role}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </section>

                        {/* Notes Table */}
                        <section className="subject-section">
                            <h2>Uploaded Notes ({notes.length})</h2>
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Title</th>
                                        <th>Subject</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {notes.map((n) => {
                                        const statusClass = n.approved ? 'status-approved' : 'status-pending';
                                        const statusText = n.approved ? 'Approved' : 'Pending';
                                        const isApproving = actionLoading[`approve-${n.id}`];
                                        const isDeleting = actionLoading[`delete-${n.id}`];

                                        return (
                                            <tr key={n.id}>
                                                <td>
                                                    <a href={n.filepath} target="_blank" rel="noopener noreferrer">
                                                        {n.title}
                                                    </a>
                                                </td>
                                                <td>{n.subject}</td>
                                                <td className={statusClass}>{statusText}</td>
                                                <td>
                                                    {!n.approved && (
                                                        <button
                                                            className="approve-btn"
                                                            disabled={isApproving}
                                                            onClick={() => handleApprove(n.id)}
                                                        >
                                                            {isApproving ? 'Approving...' : 'Approve'}
                                                        </button>
                                                    )}
                                                    <button
                                                        className="delete-btn"
                                                        disabled={isDeleting}
                                                        onClick={() => handleDelete(n.id)}
                                                    >
                                                        {isDeleting ? 'Deleting...' : 'Delete'}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </section>

                        {/* Feedback Table */}
                        <section className="subject-section">
                            <h2>Website Feedback ({feedback.length})</h2>
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>From</th>
                                        <th>Message</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {feedback.map((item, idx) => (
                                        <tr key={item.id || idx}>
                                            <td>{item.user_name}</td>
                                            <td>{item.message}</td>
                                            <td>{new Date(item.submitted_at).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </section>
                    </div>
                )}
            </main>
            <Footer />
        </>
    );
}
