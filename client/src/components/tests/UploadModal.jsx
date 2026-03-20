import React, { useState } from 'react';
import api from '../../lib/axios';
import toast from 'react-hot-toast';

const TEST_ICONS = {
    'Sit-ups':       '🏋️',
    'Push-ups':      '💪',
    'Shuttle Run':   '🏃',
    'Vertical Jump': '⬆️',
    'Endurance Run': '🫀',
    'Sprint':        '⚡',
};

const UploadModal = ({ test, isOpen, onClose, onUploadSuccess }) => {
    const [file, setFile]         = useState(null);
    const [loading, setLoading]   = useState(false);
    const [progress, setProgress] = useState(0);
    const [stage, setStage]       = useState(''); // 'uploading' | 'analyzing' | ''

    if (!isOpen || !test) return null;

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (!selected) return;

        // Client-side size check (100MB)
        if (selected.size > 100 * 1024 * 1024) {
            toast.error('Video must be under 100MB.');
            return;
        }
        setFile(selected);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const dropped = e.dataTransfer.files[0];
        if (dropped && dropped.type.startsWith('video/')) {
            setFile(dropped);
        } else {
            toast.error('Please drop a video file.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) {
            toast.error('Please select a video file first.');
            return;
        }

        const formData = new FormData();
        formData.append('video', file);
        formData.append('testId', test._id);

        setLoading(true);
        setStage('uploading');
        setProgress(0);

        try {
            const response = await api.post('/submissions', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (evt) => {
                    const pct = Math.round((evt.loaded * 100) / evt.total);
                    setProgress(pct);
                    if (pct === 100) setStage('analyzing');
                },
            });

            toast.success('Analysis complete!');
            onUploadSuccess(response.data.data);
            handleClose();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Upload failed. Please try again.');
        } finally {
            setLoading(false);
            setStage('');
            setProgress(0);
        }
    };

    const handleClose = () => {
        if (loading) return; // prevent close during upload
        setFile(null);
        setProgress(0);
        setStage('');
        onClose();
    };

    const formatSize = (bytes) => {
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        // Backdrop
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && handleClose()}>

            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">{TEST_ICONS[test.name] || '🏃'}</span>
                        <div>
                            <h2 className="font-bold text-gray-900">{test.name}</h2>
                            <p className="text-xs text-gray-400">Upload your performance video</p>
                        </div>
                    </div>
                    <button onClick={handleClose} disabled={loading}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-30">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">

                    {/* Drop zone */}
                    <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}
                        className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                            file ? 'border-amber-300 bg-amber-50' : 'border-gray-200 hover:border-amber-300 hover:bg-gray-50'
                        }`}>
                        <input type="file" accept="video/*" onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />

                        {file ? (
                            <div className="space-y-1">
                                <div className="text-3xl">🎬</div>
                                <p className="font-bold text-sm text-gray-800 truncate max-w-full px-4">{file.name}</p>
                                <p className="text-xs text-gray-500">{formatSize(file.size)}</p>
                                <p className="text-xs text-amber-600 font-medium">Click to change file</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="text-3xl">📹</div>
                                <p className="font-semibold text-sm text-gray-700">Drop your video here</p>
                                <p className="text-xs text-gray-400">or click to browse · Max 100MB</p>
                            </div>
                        )}
                    </div>

                    {/* Tips */}
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                        <p className="text-xs font-bold text-blue-700 mb-1">📋 Recording Tips</p>
                        <ul className="text-xs text-blue-600 space-y-0.5">
                            <li>· Film in landscape mode for best results</li>
                            <li>· Ensure your full body is visible</li>
                            <li>· Good lighting improves AI accuracy</li>
                            <li>· Keep camera steady throughout</li>
                        </ul>
                    </div>

                    {/* Progress bar (during upload/analysis) */}
                    {loading && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-semibold">
                                <span className="text-gray-600">
                                    {stage === 'uploading' ? '⬆️ Uploading video...' : '🤖 AI analyzing...'}
                                </span>
                                <span className="text-amber-600">
                                    {stage === 'uploading' ? `${progress}%` : 'Processing'}
                                </span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                <div
                                    className={`h-2 rounded-full transition-all duration-300 ${
                                        stage === 'analyzing'
                                            ? 'bg-amber-500 animate-pulse w-full'
                                            : 'bg-amber-500'
                                    }`}
                                    style={{ width: stage === 'uploading' ? `${progress}%` : '100%' }}
                                />
                            </div>
                            {stage === 'analyzing' && (
                                <p className="text-xs text-gray-400 text-center">
                                    This takes 30–120 seconds depending on video length
                                </p>
                            )}
                        </div>
                    )}

                    {/* Submit button */}
                    <button type="submit" disabled={loading || !file}
                        className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2">
                        {loading ? (
                            <>
                                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                                </svg>
                                {stage === 'uploading' ? 'Uploading...' : 'Analyzing...'}
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                                </svg>
                                Upload & Analyze
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default UploadModal;