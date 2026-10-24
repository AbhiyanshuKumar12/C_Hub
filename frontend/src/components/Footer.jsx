import React from 'react';

export default function Footer({ text = '© 2025 CollegeHub. Share with your friends.' }) {
    return (
        <footer>
            <div className="container">
                <p>{text}</p>
            </div>
        </footer>
    );
}
