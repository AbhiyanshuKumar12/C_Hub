import React from 'react';
import Footer from '../components/Footer';

export default function About() {
    return (
        <>
            <main className="container page-padding">
                <div className="about-content">
                    <h1 className="page-title">Our Mission</h1>
                    <p className="page-subtitle">Connecting students and making knowledge accessible to everyone.</p>
                </div>
            </main>
            <Footer text="© 2025 CollegeHub. Made with ❤️ by a fellow student." />
        </>
    );
}
