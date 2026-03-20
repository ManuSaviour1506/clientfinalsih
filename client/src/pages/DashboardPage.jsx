import React, { useState, useEffect } from 'react';
import api from '../lib/axios';
import Spinner from '../components/common/Spinner';
import AngleChart from '../components/charts/AngleChart.jsx';
import VelocityChart from '../components/charts/VelocityChart.jsx';
import AnalysisVideoPlayer from '../components/submissions/AnalysisVideoPlayer.jsx';
import UploadModal from '../components/tests/UploadModal.jsx';

const TEST_ICONS = {
    'Sit-ups': '🏋️', 'Push-ups': '💪', 'Shuttle Run': '🏃',
    'Vertical Jump': '⬆️', 'Endurance Run': '🫀', 'Sprint': '⚡',
};

const ScoreBadge = ({ score }) => {
    const s = Number(score) || 0;
    const color = s >= 8 ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
                : s >= 6 ? 'text-amber-600 bg-amber-50 border-amber-200'
                :           'text-red-500 bg-red-50 border-red-200';
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black border ${color}`}>
            {s.toFixed(1)}<span className="font-medium opacity-60">/10</span>
        </span>
    );
};

// ── Chart data builder ────────────────────────────────────────────────
// Python pushups.py stores:  report.velocity_profile_sampled = [2.1, 3.4, 1.8, ...]
// Python situps.py stores:   report.score_breakdown = { rep_score: 3, form_score: 2, ... }
// Node saves these into:     submission.analysisReport.*
//
// VelocityChart expects:  [{ time: "0", velA: 2.1, velB: 3.0 }, ...]
// AngleChart expects:     [{ subject: "Rep Score", valueA: 3, valueB: 2 }, ...]

const prepareChartData = (subA, subB) => {
    if (!subA) return { velocity: [], angles: [] };

    // ── Velocity ─────────────────────────────────────────────────────
    // Try multiple possible locations where velocity data might be stored
    const getVelocityArray = (sub) => {
        if (!sub) return [];
        const r = sub.analysisReport || {};
        // Primary location (pushups, situps)
        if (Array.isArray(r.velocity_profile_sampled) && r.velocity_profile_sampled.length > 0)
            return r.velocity_profile_sampled;
        // Fallback: score_breakdown values as a proxy
        if (r.score_breakdown) {
            return Object.values(r.score_breakdown).filter(v => typeof v === 'number');
        }
        // Fallback: telemetry.velocity (old schema)
        if (Array.isArray(sub.telemetry?.velocity) && sub.telemetry.velocity.length > 0)
            return sub.telemetry.velocity.map(v => (typeof v === 'object' ? v.velocity : v));
        return [];
    };

    const velAArr = getVelocityArray(subA);
    const velBArr = getVelocityArray(subB);
    const maxLen  = Math.max(velAArr.length, velBArr.length);

    const velocity = maxLen > 0
        ? Array.from({ length: maxLen }, (_, i) => ({
            time: String(i + 1),
            velA: typeof velAArr[i] === 'number' ? Number(velAArr[i].toFixed(2)) : null,
            velB: subB && typeof velBArr[i] === 'number' ? Number(velBArr[i].toFixed(2)) : null,
        }))
        : [];

    // ── Angles / Score Breakdown ──────────────────────────────────────
    // Use score_breakdown fields as the radar chart data.
    // e.g. { rep_score: 3.5, form_score: 2.1, stability_score: 1.8, stamina_score: 0.8 }
    const getBreakdown = (sub) => {
        if (!sub) return {};
        return sub.analysisReport?.score_breakdown || {};
    };

    const breakdownA = getBreakdown(subA);
    const breakdownB = getBreakdown(subB);
    const allKeys    = Array.from(new Set([
        ...Object.keys(breakdownA),
        ...Object.keys(breakdownB),
    ]));

    const angles = allKeys.length > 0
        ? allKeys.map(key => ({
            subject: key
                .replace(/_/g, ' ')
                .replace(/\b\w/g, c => c.toUpperCase())
                .replace(' Score', ''),
            valueA: Number(breakdownA[key] ?? 0),
            valueB: Number(breakdownB[key] ?? 0),
        }))
        : [];

    return { velocity, angles };
};

const DashboardPage = () => {
    const [tests, setTests]             = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading]         = useState(true);
    const [comparisonList, setComparisonList] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTest, setSelectedTest] = useState(null);

    useEffect(() => {
        Promise.all([api.get('/tests'), api.get('/submissions')])
            .then(([testsRes, subsRes]) => {
                const testList = testsRes.data.data?.tests || testsRes.data.data || [];
                const subList  = subsRes.data.data || [];
                setTests(testList);
                setSubmissions(subList);
                if (subList.length > 0) setComparisonList([subList[0]]);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const handleNewSubmission = (newSub) => {
        setSubmissions(prev => [newSub, ...prev]);
        setComparisonList([newSub]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setIsModalOpen(false);
    };

    const toggleSelection = (sub) => {
        setComparisonList(prev => {
            const exists = prev.find(s => s._id === sub._id);
            if (exists) return prev.filter(s => s._id !== sub._id);
            if (prev.length < 2) return [...prev, sub];
            return [prev[1], sub];
        });
    };

    const subA   = comparisonList[0] || null;
    const subB   = comparisonList[1] || null;
    const { velocity: chartVelocity, angles: chartAngles } = prepareChartData(subA, subB);
    const activeSubmission = comparisonList[comparisonList.length - 1] || null;

    const bestScore = submissions.length
        ? Math.max(...submissions.map(s => s.score_out_of_10 || s.score || 0))
        : 0;
    const avgScore = submissions.length
        ? submissions.reduce((a, s) => a + (s.score_out_of_10 || s.score || 0), 0) / submissions.length
        : 0;

    if (loading) return (
        <div className="flex justify-center items-center h-screen bg-gray-50"><Spinner /></div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900">Performance Dashboard</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Track, compare and improve your athletic performance</p>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                        comparisonList.length === 2
                            ? 'bg-amber-500 text-white border-amber-600'
                            : 'bg-white text-gray-500 border-gray-200'}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        {comparisonList.length}/2 sessions selected
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Submissions', value: submissions.length, icon: '📋' },
                        { label: 'Best Score',        value: `${bestScore.toFixed(1)}/10`, icon: '🏆' },
                        { label: 'Avg Score',         value: `${avgScore.toFixed(1)}/10`, icon: '📊' },
                        { label: 'Tests Available',   value: tests.length, icon: '🎯' },
                    ].map(({ label, value, icon }) => (
                        <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                            <div className="text-2xl mb-2">{icon}</div>
                            <p className="text-2xl font-black text-gray-900">{value}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                        </div>
                    ))}
                </div>

                {/* Video + Charts */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-1">
                        <AnalysisVideoPlayer
                            videoUrl={activeSubmission?.videoUrl}
                            feedback={activeSubmission?.feedback}
                            scoreReason={activeSubmission?.analysisReport?.score_reason}
                        />
                    </div>
                    <div className="xl:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
                                    Velocity Profile
                                </p>
                                {chartVelocity.length === 0 && (
                                    <span className="text-xs text-gray-400 italic">
                                        Complete a push-up or sit-up test to see velocity data
                                    </span>
                                )}
                            </div>
                            <VelocityChart data={chartVelocity} />
                        </div>
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
                                    Score Breakdown
                                </p>
                                {chartAngles.length === 0 && (
                                    <span className="text-xs text-gray-400 italic">
                                        No breakdown data yet
                                    </span>
                                )}
                            </div>
                            <AngleChart data={chartAngles} />
                        </div>
                    </div>
                </div>

                {/* Submission History */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-50">
                        <h2 className="font-bold text-gray-800">Submission History</h2>
                        <p className="text-xs text-gray-400 mt-0.5">Click rows to select for comparison (max 2)</p>
                    </div>
                    {submissions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                            <span className="text-5xl mb-3">📹</span>
                            <p className="font-semibold">No submissions yet</p>
                            <p className="text-sm mt-1">Complete a test below to see your analysis here</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-50">
                                <thead>
                                    <tr className="bg-gray-50/50">
                                        {['', 'Test', 'Score', 'Score Reason', 'Date'].map(h => (
                                            <th key={h} className="px-6 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {submissions.map((sub) => {
                                        const isSelected = comparisonList.some(s => s._id === sub._id);
                                        const score = sub.score_out_of_10 ?? sub.score ?? 0;
                                        return (
                                            <tr key={sub._id}
                                                onClick={() => toggleSelection(sub)}
                                                className={`cursor-pointer transition-colors ${isSelected ? 'bg-amber-50' : 'hover:bg-gray-50/80'}`}>
                                                <td className="px-6 py-4">
                                                    <div className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-amber-500 border-amber-500' : 'border-gray-200'}`}>
                                                        {isSelected && (
                                                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                                            </svg>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-lg">{TEST_ICONS[sub.test?.name] || '🏃'}</span>
                                                        <span className="text-sm font-bold text-gray-800">{sub.test?.name || 'Test'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4"><ScoreBadge score={score} /></td>
                                                <td className="px-6 py-4 max-w-xs">
                                                    <p className="text-xs text-gray-500 truncate">
                                                        {sub.analysisReport?.score_reason || '—'}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4 text-xs text-gray-400 whitespace-nowrap">
                                                    {new Date(sub.createdAt).toLocaleDateString('en-IN', {
                                                        day: 'numeric', month: 'short', year: 'numeric'
                                                    })}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* New Test */}
                <div>
                    <h2 className="font-bold text-gray-800 mb-4">New Performance Test</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {tests.map((test) => (
                            <button key={test._id}
                                onClick={() => { setSelectedTest(test); setIsModalOpen(true); }}
                                className="group text-left bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:border-amber-200 hover:shadow-md transition-all duration-200">
                                <div className="text-3xl mb-3">{TEST_ICONS[test.name] || '🏃'}</div>
                                <h3 className="font-bold text-gray-900 group-hover:text-amber-600 transition-colors">{test.name}</h3>
                                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{test.description}</p>
                                <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-amber-500">
                                    Start Test
                                    <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
                                    </svg>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {selectedTest && (
                <UploadModal
                    test={selectedTest}
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onUploadSuccess={handleNewSubmission}
                />
            )}
        </div>
    );
};

export default DashboardPage;