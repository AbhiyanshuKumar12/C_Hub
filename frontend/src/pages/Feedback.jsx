import React, { useState } from 'react';
import { api } from '../services/api';
import Footer from '../components/Footer';

export default function Feedback() {
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            await api.sendFeedback(message);
            setSubmitted(true);
        } catch (err) {
            console.error('Feedback submission error:', err);
            setError(err.message || 'Failed to submit feedback. Please try again.');
            setSubmitting(false);
        }
    };

    return (
        <>
            <main className="container page-padding">
                <div id="feedback-container">
                    {submitted ? (
                        <>
                            <h1 className="page-title">Thank You!</h1>
                            <p className="page-subtitle">Your feedback has been submitted successfully.</p>
                        </>
                    ) : (
                        <>
                            <h1 className="page-title">Website Feedback</h1>
                            <p className="page-subtitle">Have a suggestion or found a bug? Let us know!</p>
                            {error && <div className="error">{error}</div>}
                            <form id="feedback-form" className="review-form" onSubmit={handleSubmit}>
                                <label htmlFor="message">Your Feedback:</label>
                                <textarea
                                    id="message"
                                    name="message"
                                    rows="6"
                                    required
                                    placeholder="Tell us what you think..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                />
                                <button type="submit" className="cta-button" disabled={submitting}>
                                    {submitting ? 'Sending...' : 'Send Feedback'}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </main>
            <Footer />
        </>
    );
}
