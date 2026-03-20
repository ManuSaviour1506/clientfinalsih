import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from "../hooks/useAuth.js";
import Input from "../components/common/Input.jsx";
import Button from "../components/common/Button.jsx";

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        age: '',
        height: '',
        weight: '',
        state: '',
    });
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const registrationData = {
            ...formData,
            location: { state: formData.state }
        };

        try {
            await register(registrationData);
            toast.success('Registration successful! Please log in.');
            navigate('/login');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
      <div className="flex items-center justify-center">
        <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-lg shadow-md">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Create a new account
            </h2>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <Input
              id="name"
              label="Full Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <Input
              id="email"
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <Input
              id="password"
              label="Password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                id="age"
                label="Age"
                type="number"
                value={formData.age}
                onChange={handleChange}
              />
              <Input
                id="height"
                label="Height (cm)"
                type="number"
                value={formData.height}
                onChange={handleChange}
              />
              <Input
                id="weight"
                label="Weight (kg)"
                type="number"
                value={formData.weight}
                onChange={handleChange}
              />
              <Input
                id="state"
                label="State"
                type="text"
                value={formData.state}
                onChange={handleChange}
              />
            </div>
            <div>
              <Button type="submit" loading={loading} disabled={loading}>
                Register
              </Button>
            </div>
          </form>
          <p className="mt-2 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-amber-500 hover:text-amber-600"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    );
};

export default RegisterPage;
