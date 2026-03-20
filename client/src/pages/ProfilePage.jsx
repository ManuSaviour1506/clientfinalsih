import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import api from '../lib/axios.js';
import toast from 'react-hot-toast';
import Input from '../components/common/Input.jsx';
import Button from '../components/common/Button.jsx';
import LoadingAnimation from '../components/common/LoadingAnimation.jsx';

// Mock Cloudinary upload function
const uploadToCloudinary = async (file) => {
    // This is a placeholder for a real Cloudinary upload.
    // In a real app, you would post the file to your backend which then uploads to Cloudinary.
    return new Promise((resolve) => {
        setTimeout(() => {
            const mockUrl = URL.createObjectURL(file);
            resolve(mockUrl);
        }, 1500);
    });
};

const ProfilePage = () => {
    const { user, login } = useAuth();
    const [loading, setLoading] = useState(false);
    const [profileLoading, setProfileLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        age: '',
        height: '',
        weight: '',
        state: '',
        avatar: '',
    });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                age: user.age || '',
                height: user.height || '',
                weight: user.weight || '',
                state: user.location?.state || '',
                avatar: user.avatar || 'https://placehold.co/150x150/eef2f3/8e9eab?text=Profile',
            });
            setProfileLoading(false);
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            setLoading(true);
            try {
                const imageUrl = await uploadToCloudinary(file);
                setFormData(prev => ({ ...prev, avatar: imageUrl }));
                toast.success("Profile picture updated successfully!");
            } catch (error) {
                toast.error("Failed to upload profile picture.");
            } finally {
                setLoading(false);
            }
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Placeholder for API call to update profile
            const response = await api.put('/users/profile', {
                ...formData,
                location: { state: formData.state }
            });
            toast.success(response.data.message || 'Profile updated successfully!');
            // You might need to refresh user data from context or API
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update profile.');
        } finally {
            setLoading(false);
        }
    };

    if (profileLoading) {
        return <div className="flex justify-center items-center h-64"><LoadingAnimation /></div>;
    }

    return (
        <div className="flex items-center justify-center min-h-screen-minus-nav">
            <div className="bg-white p-10 rounded-xl shadow-2xl w-full max-w-2xl">
                <h1 className="text-4xl font-extrabold text-center text-amber-500 mb-8">Your Profile</h1>
                <div className="flex flex-col items-center">
                    <img
                        src={formData.avatar}
                        alt="Profile"
                        className="w-32 h-32 rounded-full object-cover border-4 border-amber-500 shadow-md mb-4"
                    />
                    <label className="cursor-pointer text-amber-500 hover:text-amber-600 font-semibold transition-colors duration-200">
                        Change Profile Picture
                        <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    </label>
                </div>
                <form onSubmit={handleUpdate} className="mt-8 space-y-6">
                    <Input id="name" label="Full Name" value={formData.name} onChange={handleChange} required />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input id="age" label="Age" type="number" value={formData.age} onChange={handleChange} />
                        <Input id="height" label="Height (cm)" type="number" value={formData.height} onChange={handleChange} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input id="weight" label="Weight (kg)" type="number" value={formData.weight} onChange={handleChange} />
                        <Input id="state" label="State" type="text" value={formData.state} onChange={handleChange} />
                    </div>
                    <div>
                        <Button type="submit" loading={loading} disabled={loading}>
                            Update Profile
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfilePage;
