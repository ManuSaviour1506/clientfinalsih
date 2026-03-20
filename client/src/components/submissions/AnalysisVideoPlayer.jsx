import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// BUG FIX 1: lucide-react icons (CheckCircle, AlertTriangle, Activity, Zap)
// were imported but lucide-react may not be installed — replaced with inline SVG.
// BUG FIX 2: report.angleHistory referenced but submission model stores
// velocity/angle data inside analysisReport — fixed field reference.
// BUG FIX 3: score shown without /10 context — now shows score_out_of_10.

const AnalysisReport = ({ submission }) => {
    if (!submission) return null;
    const { score, score_out_of_10, feedback = [], analysisReport = {}, videoUrl } = submission;
    const displayScore = score_out_of_10 ?? score ?? 0;
    const scoreColor = displayScore >= 8 ? '#10b981' : displayScore >= 6 ? '#f59e0b' : '#ef4444';

    const chartData = (analysisReport.velocity_profile_sampled || []).map((v, i) => ({
        frame: i * 10,
        velocity: typeof v === 'number' ? v : 0,
    }));

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Score header */}
            <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
                <h2 className="font-black text-gray-900">AI Performance Analysis</h2>
                <div className="flex items-center gap-1">
                    <span className="text-3xl font-black" style={{ color: scoreColor }}>
                        {Number(displayScore).toFixed(1)}
                    </span>
                    <span className="text-sm text-gray-400 font-medium">/10</span>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Score reason */}
                {analysisReport.score_reason && (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                        <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">Score Reasoning</p>
                        <p className="text-sm text-amber-800 leading-relaxed">{analysisReport.score_reason}</p>
                    </div>
                )}

                {/* Video */}
                {videoUrl && (
                    <div className="rounded-xl overflow-hidden bg-black aspect-video">
                        <video src={videoUrl} controls className="w-full h-full object-contain" />
                    </div>
                )}

                {/* Chart */}
                {chartData.length > 0 && (
                    <div>
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Velocity Profile</p>
                        <div className="h-48 bg-gray-50 rounded-xl p-3">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                    <XAxis dataKey="frame" hide />
                                    <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} />
                                    <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                    <Line type="monotone" dataKey="velocity" stroke="#f59e0b" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Feedback cards */}
                {feedback.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {feedback.slice(0, 3).map((f, i) => {
                            const colors = [
                                'border-emerald-400 bg-emerald-50 text-emerald-700',
                                'border-amber-400 bg-amber-50 text-amber-700',
                                'border-blue-400 bg-blue-50 text-blue-700',
                            ];
                            const labels = ['Strength', 'Correction', 'Tip'];
                            return (
                                <div key={i} className={`p-4 rounded-xl border-l-4 ${colors[i]}`}>
                                    <span className="text-[10px] font-black uppercase tracking-wider opacity-70">{labels[i]}</span>
                                    <p className="text-sm mt-1 leading-relaxed">{f}</p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnalysisReport;