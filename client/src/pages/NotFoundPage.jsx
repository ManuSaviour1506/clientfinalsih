// NotFoundPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center">
        <div className="text-8xl font-black text-amber-500 leading-none">404</div>
        <h2 className="mt-4 text-2xl font-bold text-gray-900">Page Not Found</h2>
        <p className="mt-2 text-gray-500 max-w-sm">
            Looks like this page went off-track. Let's get you back to the field.
        </p>
        <div className="mt-8 flex gap-3">
            <Link to="/"
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 py-2.5 rounded-xl transition-colors shadow-sm">
                Go Home
            </Link>
            <Link to="/dashboard"
                className="bg-white hover:bg-gray-50 text-gray-700 font-bold px-6 py-2.5 rounded-xl border border-gray-200 transition-colors">
                Dashboard
            </Link>
        </div>
    </div>
);

export default NotFoundPage;