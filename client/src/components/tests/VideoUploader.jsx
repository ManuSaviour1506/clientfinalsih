import React, { useState } from 'react';
import api from '../../lib/axios';
import toast from 'react-hot-toast';
import Button from '../common/Button';

// VideoUploader is used in TestPage (the standalone /test/:id route).
// The primary upload flow is UploadModal on DashboardPage.
const VideoUploader = ({ testId }) => {
    const [file, setFile]     = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) { toast.error('Please select a video file.'); return; }

        const formData = new FormData();
        formData.append('video', file);
        formData.append('testId', testId);

        setLoading(true);
        try {
            const res = await api.post('/submissions', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setResult(res.data.data);
            toast.success('Analysis complete!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Upload failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-lg mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <form onSubmit={handleSubmit} className="space-y-4">
                <label className="block text-sm font-semibold text-gray-700">
                    Select your performance video
                </label>
                <input type="file" accept="video/*"
                    onChange={(e) => { setFile(e.target.files[0]); setResult(null); }}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100 cursor-pointer" />
                <Button type="submit" loading={loading} disabled={!file || loading}>
                    Upload & Analyze
                </Button>
            </form>

            {result && (
                <div className="mt-6 p-5 bg-gray-50 rounded-xl border border-gray-100 text-center">
                    <p className="text-sm text-gray-500">Your score</p>
                    <p className="text-5xl font-black text-amber-500 my-2">
                        {result.score_out_of_10 ?? result.score ?? 0}
                        <span className="text-xl text-gray-400 font-medium">/10</span>
                    </p>
                    {result.analysisReport?.score_reason && (
                        <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                            {result.analysisReport.score_reason}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};

export default VideoUploader;