import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import api from '../lib/axios.js';
import toast from 'react-hot-toast';
import Input from '../components/common/Input.jsx';
import Button from '../components/common/Button.jsx';
import Spinner from '../components/common/Spinner.jsx';

const ProfilePage = () => {
    const { user, refreshUser } = useAuth();
    const [loading, setLoading]         = useState(false);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [avatarFile, setAvatarFile]   = useState(null);
    const [formData, setFormData]       = useState({
        name: '', age: '', height: '', weight: '', state: '',
    });

    useEffect(() => {
        if (user) {
            setFormData({
                name:   user.name            || '',
                age:    user.age             || '',
                height: user.height          || '',
                weight: user.weight          || '',
                state:  user.location?.state || '',
            });
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // BUG FIX 1: ProfilePage used a MOCK Cloudinary upload that
            // returned a blob: URL — completely non-functional in production.
            // BUG FIX 2: Used api.put() but backend now expects PATCH.
            // BUG FIX 3: Sent location as { location: { state } } which the
            // backend's $set would overwrite the whole location object.
            // Backend now uses 'location.state' dot-notation, so just send `state`.

            const fd = new FormData();
            fd.append('name',   formData.name);
            fd.append('age',    formData.age);
            fd.append('height', formData.height);
            fd.append('weight', formData.weight);
            fd.append('state',  formData.state);
            if (avatarFile) fd.append('avatar', avatarFile);

            await api.patch('/users/profile', fd, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // BUG FIX 4: After successful update, user context was stale.
            // Call refreshUser() so Navbar and all components reflect changes immediately.
            await refreshUser();
            setAvatarFile(null);
            toast.success('Profile updated successfully!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update profile.');
        } finally {
            setLoading(false);
        }
    };

    if (!user) return <div className="flex justify-center items-center h-64"><Spinner /></div>;

    const displayAvatar = avatarPreview || user?.avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=f59e0b&color=fff&size=128`;

    return (
        <div className="min-h-screen bg-gray-50 py-10">
            <div className="max-w-2xl mx-auto px-4">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

                    {/* Header banner */}
                    <div className="h-24 bg-gradient-to-r from-amber-400 to-amber-600 relative">
                        <div className="absolute -bottom-12 left-8">
                            <div className="relative">
                                <img src={displayAvatar} alt="Profile"
                                    className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-md" />
                                <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-amber-500 hover:bg-amber-600 rounded-lg flex items-center justify-center cursor-pointer transition-colors shadow">
                                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                                    </svg>
                                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="pt-16 pb-8 px-8">
                        <div className="mb-6">
                            <h1 className="text-xl font-black text-gray-900">{user.name}</h1>
                            <p className="text-sm text-gray-500 capitalize">{user.role} · {user.email}</p>
                            {avatarFile && (
                                <p className="text-xs text-amber-600 mt-1 font-medium">
                                    ✓ New photo selected — save to apply
                                </p>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <Input id="name" label="Full Name" value={formData.name} onChange={handleChange} required />

                            <div className="grid grid-cols-2 gap-4">
                                <Input id="age"    label="Age"         type="number" value={formData.age}    onChange={handleChange} />
                                <Input id="height" label="Height (cm)" type="number" value={formData.height} onChange={handleChange} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Input id="weight" label="Weight (kg)" type="number" value={formData.weight} onChange={handleChange} />
                                <Input id="state"  label="State"       type="text"   value={formData.state}  onChange={handleChange} />
                            </div>

                            <div className="pt-2">
                                <Button type="submit" loading={loading} disabled={loading}>
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Stats card */}
                <div className="mt-4 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wider">Physical Stats</h2>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        {[
                            { label: 'Age', value: user.age ? `${user.age} yrs` : '—' },
                            { label: 'Height', value: user.height ? `${user.height} cm` : '—' },
                            { label: 'Weight', value: user.weight ? `${user.weight} kg` : '—' },
                        ].map(({ label, value }) => (
                            <div key={label} className="bg-gray-50 rounded-xl p-3">
                                <p className="text-lg font-black text-amber-500">{value}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;