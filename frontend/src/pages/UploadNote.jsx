import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import Footer from '../components/Footer';

export default function UploadNote() {
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [subject, setSubject] = useState('');
    const [branch, setBranch] = useState('');
    const [professorName, setProfessorName] = useState('');
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!file) {
            setError('Please select a file to upload.');
            return;
        }

        const formData = new FormData();
        formData.append('title', title);
        formData.append('subject', subject);
        formData.append('branch', branch);
        if (professorName.trim()) {
            formData.append('professor_name', professorName.trim());
        }
        formData.append('noteFile', file);

        setUploading(true);
        try {
            await api.uploadNote(formData);
            navigate('/notes');
        } catch (err) {
            console.error('Upload error:', err);
            setError(err.message || 'File upload failed. Please try again.');
            setUploading(false);
        }
    };

    return (
        <>
            <main className="container page-padding">
                <h1 className="page-title">Upload a New Note</h1>

                {error && <div className="error">{error}</div>}

                <form
                    id="upload-form"
                    className="review-form"
                    onSubmit={handleSubmit}
                    encType="multipart/form-data"
                >
                    <label htmlFor="title">Note Title:</label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />

                    <label htmlFor="subject">Subject:</label>
                    <input
                        type="text"
                        id="subject"
                        name="subject"
                        required
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                    />

                    <label htmlFor="branch">Branch:</label>
                    <select
                        id="branch"
                        name="branch"
                        required
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                    >
                        <option value="" disabled>Select a Branch</option>
                        <option value="Computer Science">Computer Science & Engineering</option>
                        <option value="Information Science">Information Science & Engineering</option>
                    </select>

                    <label htmlFor="professor_name">Professor Name (Optional):</label>
                    <input
                        type="text"
                        id="professor_name"
                        name="professor_name"
                        placeholder="e.g., Prof. Alan Turing"
                        value={professorName}
                        onChange={(e) => setProfessorName(e.target.value)}
                    />

                    <label htmlFor="noteFile">Select File:</label>
                    <input
                        type="file"
                        id="noteFile"
                        name="noteFile"
                        required
                        onChange={(e) => setFile(e.target.files[0] || null)}
                    />

                    <button type="submit" className="cta-button" disabled={uploading}>
                        {uploading ? 'Uploading, please wait...' : 'Submit for Approval'}
                    </button>
                </form>
            </main>
            <Footer />
        </>
    );
}
