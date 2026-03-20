import React from 'react';

const TEST_ICONS = {
    'Sit-ups': '🏋️', 'Push-ups': '💪', 'Shuttle Run': '🏃',
    'Vertical Jump': '⬆️', 'Endurance Run': '🫀', 'Sprint': '⚡',
};

const TestCard = ({ test }) => (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:border-amber-200 hover:shadow-md transition-all duration-200 flex flex-col justify-between h-full group cursor-pointer">
        <div>
            <div className="text-3xl mb-3">{TEST_ICONS[test.name] || '🏃'}</div>
            <h3 className="font-bold text-gray-900 group-hover:text-amber-600 transition-colors">{test.name}</h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{test.description}</p>
        </div>
        <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-amber-500">
            Start Test
            <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
            </svg>
        </div>
    </div>
);

export default TestCard;