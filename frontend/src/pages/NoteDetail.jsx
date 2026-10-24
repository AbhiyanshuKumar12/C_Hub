import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import Footer from '../components/Footer';

export default function NoteDetail() {
    const params = useParams();
    const [searchParams] = useSearchParams();
    const noteId = params.id || searchParams.get('id');

    const [note, setNote] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [noteError, setNoteError] = useState('');

    // Review form state
    const [rating, setRating] = useState('');
    const [comment, setComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);
    const [reviewError, setReviewError] = useState('');

    const fetchNote = async () => {
        if (!noteId) {
            setNoteError('No note selected.');
            setLoading(false);
            return;
        }

        try {
            const data = await api.getNoteById(noteId);
            setNote(data);
        } catch (err) {
            console.error('Note fetch error:', err);
            setNoteError('Could not load note details. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const fetchReviews = async () => {
        if (!noteId) return;
        try {
            const data = await api.getReviews(noteId);
            setReviews(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Reviews fetch error:', err);
        }
    };

    useEffect(() => {
        fetchNote();
        fetchReviews();
    }, [noteId]);

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        setReviewError('');

        const ratingNum = Number(rating);
        if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
            setReviewError('Please select a valid rating.');
            return;
        }
        if (!comment.trim()) {
            setReviewError('Please add a comment.');
            return;
        }

        setSubmittingReview(true);
        try {
            await api.addReview(noteId, ratingNum, comment.trim());
            setRating('');
            setComment('');
            await fetchReviews();
        } catch (err) {
            console.error('Submit review error:', err);
            setReviewError(err.message || 'Could not submit review. Try again later.');
        } finally {
            setSubmittingReview(false);
        }
    };

    // Calculate rating summary
    const totalReviews = reviews.length;
    let avgRating = 0;
    let starsDisplay = '';
    if (totalReviews > 0) {
        const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
        avgRating = Math.round((sum / totalReviews) * 10) / 10;
        const roundedStars = Math.round(avgRating);
        starsDisplay = '★'.repeat(Math.max(0, Math.min(5, roundedStars))) + '☆'.repeat(Math.max(0, 5 - roundedStars));
    }

    const renderReviewStars = (val) => {
        const num = Math.max(0, Math.min(5, Number(val) || 0));
        return '★'.repeat(num) + '☆'.repeat(5 - num);
    };

    const isPdf = note?.filepath?.toLowerCase().endsWith('.pdf');

    return (
        <>
            <main className="container page-padding">
                {/* DOWNLOAD SECTION */}
                <section id="note-download-section" className="download-section">
                    {loading ? (
                        <h1 id="note-title">Loading note...</h1>
                    ) : noteError ? (
                        <div>
                            <h1 id="note-title">Unable to load note</h1>
                            <div className="error" style={{ marginTop: '12px' }}>{noteError}</div>
                            <Link to="/notes" className="cta-button" style={{ marginTop: '20px' }}>
                                Back to Notes
                            </Link>
                        </div>
                    ) : note ? (
                        <>
                            <h1 id="note-title">{note.title || 'Untitled Note'}</h1>
                            {note.professor_name && (
                                <p id="note-professor" className="muted" style={{ fontStyle: 'italic', marginBottom: '20px' }}>
                                    Notes by: {note.professor_name}
                                </p>
                            )}

                            <div id="download-button-container" aria-live="polite">
                                {note.filepath ? (
                                    <>
                                        {isPdf && (
                                            <iframe
                                                src={note.filepath}
                                                className="pdf-iframe"
                                                title="PDF Preview"
                                            />
                                        )}
                                        <div>
                                            <a
                                                href={note.filepath}
                                                className="download-btn-large"
                                                download
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                📄 Download Notes
                                            </a>
                                            <a
                                                href={note.filepath}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="muted"
                                                style={{ display: 'inline-block', marginLeft: '12px' }}
                                            >
                                                View in browser
                                            </a>
                                        </div>
                                    </>
                                ) : (
                                    <div className="muted">No file attached to this note.</div>
                                )}
                            </div>
                        </>
                    ) : null}
                </section>

                {/* REVIEW SECTION */}
                {!loading && !noteError && (
                    <section className="reviews-section">
                        <h2>Student Reviews</h2>

                        <div id="rating-summary" className="rating-summary">
                            {totalReviews === 0 ? (
                                <h3>No reviews yet. Be the first!</h3>
                            ) : (
                                <>
                                    <h3>
                                        Average Rating: {avgRating.toFixed(1)} / 5.0 ({totalReviews} review{totalReviews > 1 ? 's' : ''})
                                    </h3>
                                    <div className="star">{starsDisplay}</div>
                                </>
                            )}
                        </div>

                        <div id="reviews-list">
                            {reviews.map((rev) => (
                                <div key={rev.id || `${rev.user_id}-${rev.created_at}`} className="review-card">
                                    <div className="review-author">{rev.user_name || 'Anonymous'}</div>
                                    <div className="review-rating">{renderReviewStars(rev.rating)}</div>
                                    <p className="review-text">{rev.comment}</p>
                                </div>
                            ))}
                        </div>

                        <div className="review-form">
                            <h3>Leave a Review</h3>
                            {reviewError && (
                                <div id="review-error" role="alert" className="error">
                                    {reviewError}
                                </div>
                            )}
                            <form id="review-form" onSubmit={handleReviewSubmit}>
                                <label htmlFor="rating">Rating:</label>
                                <select
                                    id="rating"
                                    name="rating"
                                    required
                                    value={rating}
                                    onChange={(e) => setRating(e.target.value)}
                                >
                                    <option value="" disabled>Select a Rating</option>
                                    <option value="5">★★★★★ (Excellent)</option>
                                    <option value="4">★★★★☆ (Good)</option>
                                    <option value="3">★★★☆☆ (Average)</option>
                                    <option value="2">★★☆☆☆ (Poor)</option>
                                    <option value="1">★☆☆☆☆ (Terrible)</option>
                                </select>

                                <label htmlFor="comment">Your Comment:</label>
                                <textarea
                                    id="comment"
                                    name="comment"
                                    rows="4"
                                    required
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                />

                                <button type="submit" className="cta-button" disabled={submittingReview}>
                                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                                </button>
                            </form>
                        </div>
                    </section>
                )}
            </main>
            <Footer />
        </>
    );
}
