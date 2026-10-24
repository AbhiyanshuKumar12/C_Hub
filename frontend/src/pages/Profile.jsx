import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import Footer from '../components/Footer';

export default function Profile() {
    const { user } = useAuth();
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deletingId, setDeletingId] = useState(null);

    const loadUserNotes = async () => {
        try {
            const data = await api.getUserNotes();
            setNotes(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching user notes:', err);
            setError('Failed to load notes.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUserNotes();
    }, []);

    const handleDelete = async (noteId) => {
        if (!window.confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
            return;
        }

        setDeletingId(noteId);
        try {
            const res = await api.deleteUserNote(noteId);
            if (res.success) {
                await loadUserNotes();
            } else {
                alert('Error: ' + (res.error || 'Could not delete note.'));
            }
        } catch (err) {
            console.error('Delete error:', err);
            alert('An error occurred while deleting the note.');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <>
            <main className="container page-padding">
                <h1 className="page-title">My Profile</h1>

                <div id="profile-info" className="profile-header">
                    <h2>Welcome, {user.name}!</h2>
                    <p><strong>Role:</strong> {(user.role || 'STUDENT').toUpperCase()}</p>
                    <p>Manage your uploaded notes and check their approval status below.</p>
                </div>

                <section className="subject-section">
                    <h2>My Uploaded Notes</h2>
                    <div id="user-notes-container">
                        {loading ? (
                            <p>Loading your notes...</p>
                        ) : error ? (
                            <p className="error">{error}</p>
                        ) : notes.length === 0 ? (
                            <p>You haven't uploaded any notes yet.</p>
                        ) : (
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Title</th>
                                        <th>Subject</th>
                                        <th>Status</th>
                                        <th>Avg. Rating</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {notes.map((note) => {
                                        const statusClass = note.approved ? 'status-approved' : 'status-pending';
                                        const statusText = note.approved ? 'Approved' : 'Pending';
                                        const ratingText = note.avg_rating
                                            ? `${Number(note.avg_rating).toFixed(1)} ★ (${note.review_count} reviews)`
                                            : 'No reviews';

                                        return (
                                            <tr key={note.id}>
                                                <td>
                                                    <Link to={`/notes/${note.id}`} className="view-link">
                                                        {note.title}
                                                    </Link>
                                                </td>
                                                <td>{note.subject}</td>
                                                <td className={statusClass}>{statusText}</td>
                                                <td>{ratingText}</td>
                                                <td>
                                                    <button
                                                        className="delete-btn"
                                                        disabled={deletingId === note.id}
                                                        onClick={() => handleDelete(note.id)}
                                                    >
                                                        {deletingId === note.id ? 'Deleting...' : 'Delete'}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
}
