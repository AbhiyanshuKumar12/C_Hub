import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import Footer from '../components/Footer';

export default function Notes() {
    const [notes, setNotes] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchNotes = async (query = '') => {
        setLoading(true);
        setError('');
        try {
            const data = await api.getNotes(query);
            setNotes(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching notes:', err);
            setError('Failed to load notes. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotes();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchNotes(searchTerm.trim());
    };

    // Group notes by branch (Computer Science, Information Science, and any others)
    const branches = { 'Computer Science': [], 'Information Science': [] };
    notes.forEach((note) => {
        const branchKey = note.branch || 'Other';
        if (!branches[branchKey]) {
            branches[branchKey] = [];
        }
        branches[branchKey].push(note);
    });

    const hasAnyNotes = notes.length > 0;

    return (
        <>
            <main className="container page-padding">
                <h1 className="page-title">Course Notes</h1>

                <form
                    id="search-form"
                    className="review-form"
                    style={{ marginBottom: '40px', maxWidth: 'none' }}
                    onSubmit={handleSearch}
                >
                    <input
                        type="search"
                        id="search-input"
                        name="q"
                        placeholder="Search by title or subject..."
                        style={{ width: '80%', display: 'inline-block', marginRight: '10px' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button type="submit" className="cta-button" style={{ width: '18%' }}>
                        Search
                    </button>
                </form>

                {loading ? (
                    <p style={{ textAlign: 'center' }}>Loading notes...</p>
                ) : error ? (
                    <div className="error" style={{ textAlign: 'center' }}>{error}</div>
                ) : !hasAnyNotes ? (
                    <p style={{ textAlign: 'center' }}>No notes found for your search.</p>
                ) : (
                    <div id="notes-container">
                        {Object.entries(branches).map(([branchName, branchNotes]) => {
                            if (branchNotes.length === 0) return null;
                            const displayName = branchName.includes('Engineering')
                                ? branchName
                                : `${branchName} & Engineering`;

                            return (
                                <section key={branchName} className="subject-section">
                                    <h2>{displayName}</h2>
                                    <div className="note-list">
                                        {branchNotes.map((note) => (
                                            <Link
                                                key={note.id}
                                                to={`/notes/${note.id}`}
                                                className="note-item"
                                            >
                                                <h3>{note.title}</h3>
                                                <p>Subject: {note.subject}</p>
                                            </Link>
                                        ))}
                                    </div>
                                </section>
                            );
                        })}
                    </div>
                )}
            </main>
            <Footer />
        </>
    );
}
