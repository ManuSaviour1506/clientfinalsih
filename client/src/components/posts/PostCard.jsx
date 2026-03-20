import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import api from '../../lib/axios';

// BUG FIX 1: CRITICAL SECURITY — PostCard imported ImageKit with PRIVATE KEY
// exposed on the frontend via VITE_IMAGEKIT_PRIVATE_KEY.
// Private keys in Vite env vars are BUNDLED INTO THE PUBLIC JS — anyone
// can open DevTools → Sources and read your private key, then delete/modify
// all your ImageKit files. NEVER put private keys on the frontend.
// Fix: call the backend's /media/signed-url endpoint instead.

const PostCard = ({ post }) => {
    const [videoUrl, setVideoUrl] = useState(null);
    const [videoError, setVideoError] = useState(false);
    const { user, description, createdAt, videoUrl: videoPath } = post;

    useEffect(() => {
        if (!videoPath) return;
        let cancelled = false;

        // Request signed URL from backend (which uses private key server-side)
        api.post('/media/signed-url', { fileUrl: videoPath })
            .then(res => {
                if (!cancelled) setVideoUrl(res.data.data?.signedUrl || videoPath);
            })
            .catch(() => {
                // Fallback: try the raw URL (works if files are public)
                if (!cancelled) setVideoUrl(videoPath);
            });

        return () => { cancelled = true; };
    }, [videoPath]);

    const avatarSrc = user?.avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=f59e0b&color=fff&size=80`;

    // BUG FIX 2: formatDistanceToNow crashed when createdAt was undefined/invalid.
    const timeAgo = (() => {
        try { return formatDistanceToNow(new Date(createdAt)) + ' ago'; }
        catch { return 'recently'; }
    })();

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
            {/* Author row */}
            <div className="flex items-center gap-3 px-5 py-4">
                <img src={avatarSrc} alt={user?.name || 'User'}
                    className="w-10 h-10 rounded-xl object-cover border-2 border-amber-100 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm truncate">{user?.name || 'Anonymous'}</p>
                    <p className="text-xs text-gray-400">{timeAgo}</p>
                </div>
                <span className="text-xs bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-full font-semibold capitalize">
                    {user?.role || 'athlete'}
                </span>
            </div>

            {/* Description */}
            {description && (
                <p className="px-5 pb-3 text-sm text-gray-700 leading-relaxed">{description}</p>
            )}

            {/* Video */}
            {videoPath && (
                <div className="bg-black aspect-video">
                    {videoError ? (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 gap-2">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.723v6.554a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/></svg>
                            <p className="text-xs">Video unavailable</p>
                        </div>
                    ) : videoUrl ? (
                        <video controls src={videoUrl}
                            className="w-full h-full"
                            onError={() => setVideoError(true)}>
                            Your browser does not support the video tag.
                        </video>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500"></div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PostCard;