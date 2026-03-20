import React from 'react';

const LeaderboardTable = ({ data = [] }) => {
    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <span className="text-5xl mb-3">🏅</span>
                <p className="font-semibold text-sm">No athletes ranked yet</p>
                <p className="text-xs mt-1">Be the first to submit for this test!</p>
            </div>
        );
    }

    const renderRankBadge = (rank) => {
        if (rank === 1) return (
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-yellow-400 text-yellow-900 font-black text-xs shadow-md">
                🥇
            </span>
        );
        if (rank === 2) return (
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-300 text-gray-700 font-black text-xs shadow">
                🥈
            </span>
        );
        if (rank === 3) return (
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-orange-300 text-orange-900 font-black text-xs shadow">
                🥉
            </span>
        );
        return (
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-gray-500 font-bold text-xs">
                {rank}
            </span>
        );
    };

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-50">
                <thead>
                    <tr className="bg-gray-50/60">
                        <th className="px-6 py-3 text-center text-[10px] font-black text-gray-400 uppercase tracking-wider w-16">Rank</th>
                        <th className="px-6 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">Athlete</th>
                        <th className="px-6 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">Location</th>
                        <th className="px-6 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">Best Score</th>
                        <th className="px-6 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">Date</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-50">
                    {data.map((entry, index) => {
                        const rank = index + 1;
                        const score = Number(entry.score) || 0;
                        const scoreColor =
                            score >= 8 ? 'text-emerald-600' :
                            score >= 6 ? 'text-amber-600' :
                                         'text-red-500';

                        return (
                            <tr
                                key={entry.athleteId || index}
                                className={`transition-colors hover:bg-gray-50/80 ${rank <= 3 ? 'bg-amber-50/20' : ''}`}
                            >
                                <td className="px-6 py-4 text-center">
                                    {renderRankBadge(rank)}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-xs font-black flex-shrink-0">
                                            {(entry.name || 'A').charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-sm font-bold text-gray-900">
                                            {entry.name || 'Unknown Athlete'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {entry.location?.state || 'N/A'}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`text-lg font-black ${scoreColor}`}>
                                        {score.toFixed(1)}
                                    </span>
                                    <span className="text-xs text-gray-400 ml-0.5">/10</span>
                                </td>
                                <td className="px-6 py-4 text-xs text-gray-400 whitespace-nowrap">
                                    {entry.date
                                        ? new Date(entry.date).toLocaleDateString('en-IN', {
                                            day: 'numeric', month: 'short', year: 'numeric'
                                          })
                                        : '—'}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default LeaderboardTable;