import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/Footer';

export default function Login() {
    const navigate = useNavigate();
    const { login, register } = useAuth();

    // Login state
    const [loginUsn, setLoginUsn] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [loginLoading, setLoginLoading] = useState(false);
    const [loginError, setLoginError] = useState('');

    // Register state
    const [regName, setRegName] = useState('');
    const [regUsn, setRegUsn] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [regLoading, setRegLoading] = useState(false);
    const [regMessage, setRegMessage] = useState({ text: '', type: '' });

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginError('');
        setLoginLoading(true);

        try {
            await login(loginUsn, loginPassword);
            navigate('/notes');
        } catch (err) {
            console.error('Login failed:', err);
            setLoginError(err.message || 'Login failed: Incorrect credentials.');
        } finally {
            setLoginLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setRegMessage({ text: '', type: '' });
        setRegLoading(true);

        try {
            const resultText = await register(regName, regUsn, regPassword);
            setRegMessage({
                text: 'Registration successful! You can now log in above.',
                type: 'success',
            });
            setRegName('');
            setRegUsn('');
            setRegPassword('');
        } catch (err) {
            console.error('Registration error:', err);
            setRegMessage({
                text: err.message || 'Error registering user.',
                type: 'error',
            });
        } finally {
            setRegLoading(false);
        }
    };

    return (
        <>
            <main className="login-container">
                <div className="form-box">
                    <h2>Login</h2>
                    {loginError && <div className="error">{loginError}</div>}
                    <form onSubmit={handleLogin}>
                        <div className="input-group">
                            <label htmlFor="login-usn">USN</label>
                            <input
                                type="text"
                                id="login-usn"
                                name="usn"
                                placeholder="Enter your USN"
                                required
                                value={loginUsn}
                                onChange={(e) => setLoginUsn(e.target.value)}
                            />
                        </div>
                        <div className="input-group">
                            <label htmlFor="login-password">Password</label>
                            <input
                                type="password"
                                id="login-password"
                                name="password"
                                placeholder="Enter your password"
                                required
                                value={loginPassword}
                                onChange={(e) => setLoginPassword(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="cta-button login-page-btn" disabled={loginLoading}>
                            {loginLoading ? 'Logging in...' : 'Login'}
                        </button>
                    </form>
                </div>

                <div className="form-box">
                    <h2>Create an Account</h2>
                    {regMessage.text && (
                        <div className={regMessage.type === 'success' ? 'success' : 'error'}>
                            {regMessage.text}
                        </div>
                    )}
                    <form onSubmit={handleRegister}>
                        <div className="input-group">
                            <label htmlFor="register-name">Full Name</label>
                            <input
                                type="text"
                                id="register-name"
                                name="name"
                                placeholder="Enter your full name"
                                required
                                value={regName}
                                onChange={(e) => setRegName(e.target.value)}
                            />
                        </div>
                        <div className="input-group">
                            <label htmlFor="register-usn">USN (e.g., 1ce21cs001)</label>
                            <input
                                type="text"
                                id="register-usn"
                                name="usn"
                                placeholder="Enter your college USN"
                                required
                                value={regUsn}
                                onChange={(e) => setRegUsn(e.target.value)}
                            />
                        </div>
                        <div className="input-group">
                            <label htmlFor="register-password">Password</label>
                            <input
                                type="password"
                                id="register-password"
                                name="password"
                                placeholder="Create a password"
                                required
                                value={regPassword}
                                onChange={(e) => setRegPassword(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="cta-button login-page-btn" disabled={regLoading}>
                            {regLoading ? 'Registering...' : 'Register'}
                        </button>
                    </form>
                </div>
            </main>
            <Footer text="© 2025 CollegeHub. Made with ❤️ by a fellow student." />
        </>
    );
}
