import React, { useState, useEffect } from 'react';
import api from '../lib/axios';
import PostCard from '../components/posts/PostCard';
import CreatePost from '../components/posts/CreatePost';
import Spinner from '../components/common/Spinner';

const FeedPage = () => {
    const [posts, setPosts]   = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError]   = useState('');

    useEffect(() => {
        api.get('/posts')
            .then(res => setPosts(res.data.data || []))
            .catch(() => setError('Failed to load posts.'))
            .finally(() => setLoading(false));
    }, []);

    // BUG FIX 1: onPostCreated triggered a full refetch of all posts.
    // Prepend the new post directly to avoid unnecessary API call.
    const handlePostCreated = (newPost) => {
        setPosts(prev => [newPost, ...prev]);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Community Feed</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Share your performance videos with the community</p>
                </div>

                <CreatePost onPostCreated={handlePostCreated} />

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>
                )}

                {loading ? (
                    <div className="flex justify-center py-16"><Spinner /></div>
                ) : posts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <span className="text-5xl mb-3">📭</span>
                        <p className="font-semibold">No posts yet</p>
                        <p className="text-sm mt-1">Be the first to share your performance!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {posts.map(post => <PostCard key={post._id} post={post} />)}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FeedPage;