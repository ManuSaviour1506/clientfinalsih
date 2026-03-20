// ─────────────────────────────────────────────────────────
// HomePage.jsx
// ─────────────────────────────────────────────────────────
import React from 'react';
import { Link } from 'react-router-dom';

export const HomePage = () => (
    <div className="min-h-screen bg-white">
        {/* Hero */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
            <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-1.5 text-xs font-bold text-amber-700 mb-8">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                AI-Powered Athletic Assessment Platform
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-gray-900 leading-[1.05] tracking-tight">
                Discover India's Next
                <span className="block text-amber-500">Athletic Champions</span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-600 leading-relaxed">
                A standardized, tech-driven platform using computer vision and AI to identify
                and nurture sporting talent from every corner of the nation.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/register"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold px-8 py-3.5 rounded-xl shadow-lg shadow-amber-200 transition-all hover:shadow-amber-300 hover:scale-105">
                    Get Started Free
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
                </Link>
                <Link to="/leaderboard"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold px-8 py-3.5 rounded-xl transition-all hover:scale-105">
                    View Leaderboard
                </Link>
            </div>
        </div>

        {/* Features */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
                { icon: '🤖', title: 'AI Skeletal Analysis', desc: 'MediaPipe-powered pose estimation tracks 33 body landmarks in real-time to score your form.' },
                { icon: '📊', title: 'Detailed Scoring', desc: 'Get a /10 score with a full written reason explaining exactly how your performance was evaluated.' },
                { icon: '🏆', title: 'National Rankings', desc: 'Compete on the leaderboard and get discovered by scouts and sports authorities across India.' },
            ].map(({ icon, title, desc }) => (
                <div key={title} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                    <div className="text-3xl mb-3">{icon}</div>
                    <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
                </div>
            ))}
        </div>

        {/* Hero image */}
        <div className="max-w-4xl mx-auto px-4 pb-20">
            <div className="rounded-3xl overflow-hidden shadow-2xl border border-gray-100">
                <img src="https://res.cloudinary.com/ddgfjerss/image/upload/v1758572435/Gemini_Generated_Image_78h2pi78h2pi78h2_j6y53o.jpg"
                    alt="Athletic champions"
                    className="w-full h-auto object-cover" />
            </div>
        </div>
    </div>
);

export default HomePage;