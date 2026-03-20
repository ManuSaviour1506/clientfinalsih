import React from 'react';

const AnalysisReport = ({ report }) => {
    if (!report || Object.keys(report).length === 0) {
        return <p>No detailed report available.</p>;
    }

    return (
        <div className="space-y-4 text-sm">
            <h4 className="font-bold text-lg text-gray-800">Full Report</h4>
            <div className="p-4 bg-gray-50 rounded-lg">
                <p><strong>Total Reps Counted:</strong> {report.total_reps ?? 'N/A'}</p>
                <p><strong>Incomplete Reps:</strong> {report.incomplete_reps ?? 'N/A'}</p>
            </div>
            <div>
                <h5 className="font-semibold text-gray-700">Suggestions:</h5>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
                    {(report.feedback_points && report.feedback_points.length > 0) ? (
                        report.feedback_points.map((point, index) => <li key={index}>{point}</li>)
                    ) : (
                        <li>No specific suggestions at this time.</li>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default AnalysisReport;