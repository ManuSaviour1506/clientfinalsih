import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import Spinner from '../components/common/Spinner';
import UploadModal from '../components/tests/UploadModal.jsx';

// BUG FIX 1: TestPage used a hardcoded MOCK_TESTS object with hardcoded
// ObjectIds — this broke the moment any ID in the DB didn't match exactly.
// The "Push-ups" ID was also different from tests.js seed data.
// Fix: fetch the test from the API using the testId param.

const TEST_ICONS = {
    'Sit-ups':       '🏋️', 'Push-ups': '💪', 'Shuttle Run': '🏃',
    'Vertical Jump': '⬆️', 'Endurance Run': '🫀', 'Sprint': '⚡',
};

const TestPage = () => {
    const { testId }    = useParams();
    const navigate      = useNavigate();
    const [test, setTest]     = useState(null);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        api.get('/tests')
            .then(res => {
                const list = res.data.data?.tests || res.data.data || [];
                const found = list.find(t => t._id === testId);
                setTest(found || null);
            })
            .catch(() => setTest(null))
            .finally(() => setLoading(false));
    }, [testId]);

    if (loading) return <div className="flex justify-center items-center h-64"><Spinner /></div>;

    if (!test) return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
            <span className="text-6xl">🔍</span>
            <h2 className="text-xl font-bold text-gray-800">Test not found</h2>
            <p className="text-sm text-gray-500">This test ID doesn't exist in the database.</p>
            <Link to="/dashboard" className="text-sm font-semibold text-amber-500 hover:text-amber-600 underline underline-offset-2">
                ← Back to Dashboard
            </Link>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 py-10">
            <div className="max-w-2xl mx-auto px-4 space-y-6">

                {/* Back link */}
                <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-amber-500 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
                    Back to Dashboard
                </Link>

                {/* Test card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                    <div className="text-6xl mb-4">{TEST_ICONS[test.name] || '🏃'}</div>
                    <h1 className="text-2xl font-black text-gray-900">{test.name}</h1>
                    <p className="text-gray-500 mt-2 leading-relaxed">{test.description}</p>

                    <div className="mt-8 bg-amber-50 border border-amber-100 rounded-xl p-4 text-left">
                        <p className="text-xs font-black text-amber-700 uppercase tracking-wider mb-2">📋 How it works</p>
                        <ul className="space-y-1.5 text-sm text-amber-900">
                            <li className="flex items-start gap-2"><span className="font-bold">1.</span> Record a clear video of yourself performing the exercise</li>
                            <li className="flex items-start gap-2"><span className="font-bold">2.</span> Upload the video below</li>
                            <li className="flex items-start gap-2"><span className="font-bold">3.</span> Our AI analyzes your movement and scores your performance /10</li>
                            <li className="flex items-start gap-2"><span className="font-bold">4.</span> View your skeletal analysis video and detailed feedback</li>
                        </ul>
                    </div>

                    <button onClick={() => setModalOpen(true)}
                        className="mt-6 w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-sm">
                        Upload Video & Analyze
                    </button>
                </div>
            </div>

            <UploadModal
                test={test}
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onUploadSuccess={(sub) => navigate('/dashboard', { state: { newSubmission: sub } })}
            />
        </div>
    );
};

export default TestPage;