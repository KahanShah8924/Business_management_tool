import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import InputGroup from '../components/InputGroup';
import api from '../api/axios';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await api.post('/auth/login', { email, password });
            const token = res.data?.token;
            if (token) {
                localStorage.setItem('token', token);
            }
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-blue-50">
            <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg border border-blue-100">
                <h2 className="text-3xl font-bold text-center text-blue-600 mb-8">Sign In</h2>

                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

                <form onSubmit={handleLogin}>
                    <InputGroup
                        label="Email Address"
                        name="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <InputGroup
                        label="Password"
                        name="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-200 mt-4 ${loading ? 'opacity-50' : ''}`}
                    >
                        {loading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>

                <p className="mt-4 text-center text-gray-600">
                    Don't have an account? <Link to="/signup" className="text-blue-500 hover:text-blue-700 font-bold">Sign Up</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
