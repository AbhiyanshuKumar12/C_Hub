// Centralized API Service for CollegeHub
// Preserves exact backend endpoints, session cookies, and request/response behavior.

const API_BASE = '';

async function request(url, options = {}) {
    const config = {
        credentials: 'include',
        ...options,
        headers: {
            ...options.headers,
        },
    };

    const res = await fetch(`${API_BASE}${url}`, config);
    return res;
}

export const api = {
    // Auth & Status
    async getUserStatus() {
        const res = await request('/api/user-status');
        if (!res.ok) throw new Error('Failed to get user status');
        return res.json();
    },

    async login(usn, password) {
        const res = await request('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ usn, password }),
        });
        if (!res.ok) {
            const errText = await res.text();
            throw new Error(errText || 'Login failed');
        }
        return true;
    },

    async register(name, usn, password) {
        const res = await request('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, usn, password }),
        });
        const text = await res.text();
        if (!res.ok || text.startsWith('Error:')) {
            throw new Error(text || 'Registration failed');
        }
        return text;
    },

    async logout() {
        const res = await request('/logout');
        return res;
    },

    // Notes
    async getNotes(searchTerm = '') {
        const url = searchTerm ? `/api/notes?q=${encodeURIComponent(searchTerm)}` : '/api/notes';
        const res = await request(url);
        if (!res.ok) throw new Error('Failed to fetch notes');
        return res.json();
    },

    async getNoteById(id) {
        const res = await request(`/api/notes/${encodeURIComponent(id)}`);
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            throw new Error(text || 'Failed to fetch note details');
        }
        return res.json();
    },

    async uploadNote(formData) {
        const res = await request('/upload', {
            method: 'POST',
            body: formData, // browser automatically sets multipart/form-data boundary
        });
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            throw new Error(text || 'File upload failed');
        }
        return true;
    },

    // Reviews
    async getReviews(noteId) {
        const res = await request(`/api/notes/${encodeURIComponent(noteId)}/reviews`);
        if (!res.ok) throw new Error('Failed to fetch reviews');
        return res.json();
    },

    async addReview(noteId, rating, comment) {
        const res = await request(`/api/notes/${encodeURIComponent(noteId)}/reviews`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rating: Number(rating), comment }),
        });
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            throw new Error(text || 'Failed to submit review');
        }
        return res.json();
    },

    // Feedback
    async sendFeedback(message) {
        const res = await request('/api/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message }),
        });
        if (!res.ok) throw new Error('Failed to submit feedback');
        return res.json();
    },

    // User Profile
    async getUserNotes() {
        const res = await request('/api/user/notes');
        if (!res.ok) throw new Error('Failed to fetch user notes');
        return res.json();
    },

    async deleteUserNote(noteId) {
        const res = await request(`/api/user/notes/${encodeURIComponent(noteId)}`, {
            method: 'DELETE',
        });
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            throw new Error(text || 'Failed to delete note');
        }
        return res.json();
    },

    // Admin
    async getAdminUsers() {
        const res = await request('/api/admin/users');
        if (!res.ok) throw new Error('Failed to fetch users');
        return res.json();
    },

    async getAdminNotes() {
        const res = await request('/api/admin/notes');
        if (!res.ok) throw new Error('Failed to fetch notes');
        return res.json();
    },

    async getAdminFeedback() {
        const res = await request('/api/admin/feedback');
        if (!res.ok) throw new Error('Failed to fetch feedback');
        return res.json();
    },

    async approveAdminNote(noteId) {
        const res = await request(`/api/admin/notes/${encodeURIComponent(noteId)}/approve`, {
            method: 'POST',
        });
        if (!res.ok) throw new Error('Failed to approve note');
        return res.json();
    },

    async deleteAdminNote(noteId) {
        const res = await request(`/api/admin/notes/${encodeURIComponent(noteId)}`, {
            method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete note');
        return res.json();
    },
};
