import React, { useState, useEffect } from 'react';
import api from '../lib/axios';
import LeaderboardTable from '../components/leaderboard/LeaderboardTable.jsx';
import Spinner from '../components/common/Spinner.jsx';

const LeaderboardPage = () => {
    const [tests, setTests]               = useState([]);
    const [selectedTest, setSelectedTest] = useState(null);
    const [leaderboard, setLeaderboard]   = useState([]);
    const [loadingTests, setLoadingTests] = useState(true);
    const [loadingBoard, setLoadingBoard] = useState(false);
    const [error, setError]               = useState('');

    useEffect(() => {
        api.get('/tests')
            .then(res => {
                const list = res.data.data?.tests || res.data.data || [];
                setTests(list);
                if (list.length > 0) setSelectedTest(list[0]);
            })
            .catch(() => setError('Failed to load tests.'))
            .finally(() => setLoadingTests(false));
    }, []);

    useEffect(() => {
        if (!selectedTest?._id) return;
        setLoadingBoard(true);
        setError('');
        api.get(`/leaderboard/${selectedTest._id}`)
            .then(res => setLeaderboard(res.data.data || []))
            .catch(() => setError('Failed to load leaderboard data.'))
            .finally(() => setLoadingBoard(false));
    }, [selectedTest]);

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

                <div className="text-center space-y-2">
                    <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-4 py-1.5 text-xs font-bold text-amber-700 mb-2">
                        <span>🏆</span> National Rankings
                    </div>
                    <h1 className="text-3xl font-black text-gray-900">Leaderboard</h1>
                    <p className="text-gray-500 text-sm">
                        Top athletes ranked by their best AI-analyzed performance score
                    </p>
                </div>

                {loadingTests ? (
                    <div className="flex justify-center py-4"><Spinner /></div>
                ) : (
                    <div className="flex flex-wrap gap-2 justify-center">
                        {tests.map(test => (
                            <button
                                key={test._id}
                                onClick={() => setSelectedTest(test)}
                                className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-200 ${
                                    selectedTest?._id === test._id
                                        ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-amber-300 hover:text-amber-600'
                                }`}
                            >
                                {test.name}
                            </button>
                        ))}
                    </div>
                )}

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 text-center">
                        {error}
                    </div>
                )}

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                        <div>
                            <h2 className="font-bold text-gray-800">{selectedTest?.name || 'Select a test'}</h2>
                            <p className="text-xs text-gray-400 mt-0.5">Showing top 10 athletes by best score</p>
                        </div>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-semibold">
                            {leaderboard.length} athletes
                        </span>
                    </div>
                    {loadingBoard ? (
                        <div className="flex justify-center py-16"><Spinner /></div>
                    ) : (
                        <LeaderboardTable data={leaderboard} />
                    )}
                </div>

            </div>
        </div>
    );
};

export default LeaderboardPage;