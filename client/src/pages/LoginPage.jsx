// LoginPage.jsx
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import Input from '../components/common/Input.jsx';
import Button from '../components/common/Button.jsx';

const LoginPage = () => {
    const [email, setEmail]       = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading]   = useState(false);
    const { login }   = useAuth();
    const navigate    = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        // BUG FIX 1: No client-side validation — empty form was submitted to API
        if (!email.trim() || !password) {
            toast.error('Please fill in all fields.');
            return;
        }
        setLoading(true);
        try {
            await login(email.trim(), password);
            toast.success('Welcome back!');
            navigate('/dashboard');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Login failed. Check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-2 mb-6">
                        <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center shadow">
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                        </div>
                        <span className="font-black text-gray-900">Khel <span className="text-amber-500">Pratibha</span></span>
                    </Link>
                    <h1 className="text-2xl font-black text-gray-900">Sign in to your account</h1>
                    <p className="text-sm text-gray-500 mt-1">Track your performance and rankings</p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <form className="space-y-5" onSubmit={handleSubmit}>
                        <Input id="email" label="Email address" type="email"
                            value={email} onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com" required />
                        <Input id="password" label="Password" type="password"
                            value={password} onChange={(e) => setPassword(e.target.value)}
                            placeholder="Your password" required />
                        <Button type="submit" loading={loading} disabled={loading}>Sign In</Button>
                    </form>
                    <p className="mt-6 text-center text-sm text-gray-500">
                        Don't have an account?{' '}
                        <Link to="/register" className="font-bold text-amber-500 hover:text-amber-600">Sign up</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;