import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/Footer';

export default function Home() {
    const { user } = useAuth();

    return (
        <>
            <main>
                <section className="hero">
                    <div className="container">
                        <h1 id="hero-title">
                            {user.loggedIn ? `Hello, ${user.name}!` : 'Welcome, Friends!'}
                        </h1>
                        <p id="hero-subtitle">
                            {user.loggedIn
                                ? 'Your feedback helps us improve and grow together.'
                                : 'Your one-stop place for notes.'}
                        </p>
                        {user.loggedIn ? (
                            <Link to="/feedback" className="cta-button" id="hero-cta">
                                Give Feedback
                            </Link>
                        ) : (
                            <Link to="/login" className="cta-button" id="hero-cta">
                                Register to Explore Notes
                            </Link>
                        )}
                    </div>
                </section>

                <section className="features">
                    <div className="container">
                        <h2>What We Offer</h2>
                        <div className="feature-grid">
                            <div className="feature-card">
                                <h3>📚 All Faculty Notes</h3>
                                <p>Access notes from all your courses, uploaded and organized for easy study.</p>
                            </div>
                            <div className="feature-card">
                                <h3>⭐ Student Reviews</h3>
                                <p>Read and write reviews on notes to help everyone find the best resources.</p>
                            </div>
                            <div className="feature-card">
                                <h3>🤝 Feedback</h3>
                                <p>Your feedback will help to improve and grow together.</p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <Footer text="© 2025 CollegeHub. Share with your friends." />
        </>
    );
}
