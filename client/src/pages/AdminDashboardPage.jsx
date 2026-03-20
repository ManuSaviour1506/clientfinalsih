import React, { useState, useEffect } from 'react';
import api from '../lib/axios';
import Spinner from '../components/common/Spinner';

const AdminDashboardPage = () => {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading]   = useState(true);
    const [error, setError]       = useState('');
    const [search, setSearch]     = useState('');

    useEffect(() => {
        api.get('/users/admin/submissions')
            .then(res => setSubmissions(res.data.data || []))
            .catch(() => setError('Failed to load submissions. Ensure you are logged in as admin.'))
            .finally(() => setLoading(false));
    }, []);

    const filtered = submissions.filter(s =>
        s.athlete?.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.test?.name?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return <div className="flex justify-center items-center h-64"><Spinner /></div>;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                            <span className="text-xs font-bold text-red-600 uppercase tracking-wider">Admin Panel</span>
                        </div>
                        <h1 className="text-2xl font-black text-gray-900">Sports Authority Dashboard</h1>
                        <p className="text-sm text-gray-500 mt-0.5">{submissions.length} total submissions</p>
                    </div>
                    {/* Search */}
                    <div className="relative w-full sm:w-64">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                        </svg>
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search athlete or test..."
                            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-300" />
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>
                )}

                {/* Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-50">
                            <thead className="bg-gray-50/80">
                                <tr>
                                    {['Athlete', 'Test', 'Score /10', 'Score Reason', 'Date', 'Video'].map(h => (
                                        <th key={h} className="px-6 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filtered.length === 0 ? (
                                    <tr><td colSpan="6" className="text-center py-16 text-gray-400 text-sm">No submissions found</td></tr>
                                ) : filtered.map((s) => {
                                    // BUG FIX 1: Used s.score (raw rep count) — now uses score_out_of_10
                                    const score = s.score_out_of_10 ?? s.score ?? 0;
                                    const scoreColor = score >= 8 ? 'text-emerald-600' : score >= 6 ? 'text-amber-600' : 'text-red-500';
                                    return (
                                        <tr key={s._id} className="hover:bg-gray-50/80 transition-colors">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{s.athlete?.name || '—'}</p>
                                                    <p className="text-xs text-gray-400">{s.athlete?.email || ''}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700 font-medium">{s.test?.name || '—'}</td>
                                            <td className="px-6 py-4">
                                                <span className={`text-lg font-black ${scoreColor}`}>{Number(score).toFixed(1)}</span>
                                                <span className="text-xs text-gray-400 ml-0.5">/10</span>
                                            </td>
                                            <td className="px-6 py-4 max-w-xs">
                                                <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                                                    {s.analysisReport?.score_reason || '—'}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-gray-400 whitespace-nowrap">
                                                {new Date(s.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-6 py-4">
                                                {s.videoUrl ? (
                                                    <a href={s.videoUrl} target="_blank" rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg transition-colors">
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                                        Watch
                                                    </a>
                                                ) : <span className="text-xs text-gray-400">No video</span>}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardPage;