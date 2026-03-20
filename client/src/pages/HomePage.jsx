import React from 'react';
import { Link } from 'react-router-dom';
import Button from "../components/common/Button.jsx";

const HomePage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
      <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 leading-tight">
        Discover India's Next
        <span className="block text-amber-500 animate-pulse">
          Athletic Champions
        </span>
      </h1>
      <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-800">
        A standardized, tech-driven platform to identify and nurture sporting
        talent from every corner of the nation.
      </p>
      <div className="mt-12 flex flex-col sm:flex-row justify-center gap-6 w-full max-w-lg">
        <Link to="/register" className="w-full sm:w-auto">
          <Button variant="primary">Get Started</Button>
        </Link>
        <Link to="/leaderboard" className="w-full sm:w-auto">
          <Button variant="secondary">View Leaderboard</Button>
        </Link>
      </div>
      <div className="mt-16 w-full max-w-xl">
        {/* Placeholder for the image from Cloudinary */}
        <img
          src="https://res.cloudinary.com/ddgfjerss/image/upload/v1758572435/Gemini_Generated_Image_78h2pi78h2pi78h2_j6y53o.jpg"
          alt="Gamified sport icons and champions"
          className="w-full h-auto rounded-xl shadow-2xl transition-transform duration-500 ease-in-out transform hover:scale-105"
        />
      </div>
    </div>
  );
};

export default HomePage;
