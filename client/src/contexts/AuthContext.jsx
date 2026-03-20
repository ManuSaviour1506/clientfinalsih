import React, { createContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../lib/axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // BUG FIX 1: Only the decoded JWT payload was stored as `user` — meaning
    // user.avatar, user.location, user.height, user.weight were never available
    // (JWT only contains _id, email, role, name). Every profile page had to
    // re-fetch. Fix: fetch full user from /users/me after token validation.
    const loadUserFromToken = useCallback(async (token) => {
        try {
            const decoded = jwtDecode(token);
            // BUG FIX 2: No expiry check — expired tokens were used silently,
            // every API call would get 401 with no user feedback.
            const isExpired = decoded.exp * 1000 < Date.now();
            if (isExpired) {
                localStorage.removeItem('accessToken');
                return null;
            }
            // Fetch full profile so all fields (avatar, location, etc.) are available
            const res = await api.get('/users/me');
            return res.data.data;
        } catch {
            localStorage.removeItem('accessToken');
            return null;
        }
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            loadUserFromToken(token).then(userData => {
                setUser(userData);
                setLoading(false);
            });
        } else {
            setLoading(false);
        }
    }, [loadUserFromToken]);

    const login = async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        const { accessToken, user: userData } = response.data.data;
        localStorage.setItem('accessToken', accessToken);
        setUser(userData);
        return response.data;
    };

    const register = async (userData) => {
        const response = await api.post('/auth/register', userData);
        return response.data;
    };

    const logout = () => {
        localStorage.removeItem('accessToken');
        setUser(null);
    };

    // BUG FIX 3: No way to refresh user data after profile update —
    // profile changes weren't reflected until page reload.
    const refreshUser = async () => {
        try {
            const res = await api.get('/users/me');
            setUser(res.data.data);
        } catch {
            logout();
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            login,
            register,
            logout,
            refreshUser,
            loading,
            isAuthenticated: !!user,
        }}>
            {children}
        </AuthContext.Provider>
    );
};