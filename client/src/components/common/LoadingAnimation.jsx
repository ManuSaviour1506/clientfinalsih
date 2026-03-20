import React from 'react';

const LoadingAnimation = () => {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="relative flex h-24 w-24 items-center justify-center">
        {/* Outer Ring */}
        <div className="absolute h-full w-full animate-spin-slow rounded-full border-4 border-dashed border-amber-300"></div>
        {/* Inner Pulsing Circle */}
        <div className="h-16 w-16 animate-pulse rounded-full bg-amber-500 opacity-75"></div>
        {/* Center Icon (Optional, can be replaced with a game-specific icon) */}
        <div className="absolute text-white text-3xl font-bold">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default LoadingAnimation;
