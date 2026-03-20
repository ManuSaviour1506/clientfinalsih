import React from 'react';
import Spinner from './Spinner';

const Button = ({
    children,
    type = 'button',
    onClick,
    variant = 'primary',
    disabled = false,
    loading = false,
    className = '',
}) => {
    const baseClasses =
      "w-full inline-flex items-center justify-center rounded-lg border-2 border-transparent px-6 py-3 text-base font-semibold transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-offset-2 shadow-lg";

    const variantClasses = {
      primary:
        "bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-300 transform hover:scale-105",
      secondary:
        "bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400 transform hover:scale-105",
      danger:
        "bg-red-600 text-white hover:bg-red-700 focus:ring-red-300 transform hover:scale-105",
    };

    const disabledClasses = "disabled:opacity-50 disabled:cursor-not-allowed";

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`${baseClasses} ${variantClasses[variant]} ${disabledClasses} ${className}`}
        >
            {loading ? <Spinner /> : children}
        </button>
    );
};

export default Button;
