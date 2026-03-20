import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { useState, useEffect, useRef } from 'react';

const Navbar = () => {
    const { isAuthenticated, user, logout } = useAuth();
    const [menuOpen, setMenuOpen]     = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [scrolled, setScrolled]     = useState(false);
    const profileRef = useRef(null);
    const navigate   = useNavigate();

    // Shadow on scroll
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Close profile dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (profileRef.current && !profileRef.current.contains(e.target)) {
                setProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleLogout = () => {
        logout();
        setProfileOpen(false);
        navigate('/');
    };

    const navLink = ({ isActive }) =>
        `relative text-sm font-semibold transition-colors duration-200 
        ${isActive
            ? 'text-amber-500 after:absolute after:-bottom-1 after:left-0 after:w-full after:h-0.5 after:bg-amber-500 after:rounded-full'
            : 'text-gray-600 hover:text-amber-500'}`;

    return (
        <nav className={`sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 transition-shadow duration-300 ${scrolled ? 'shadow-md' : ''}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">

                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center shadow-sm group-hover:bg-amber-600 transition-colors">
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                            </svg>
                        </div>
                        <span className="text-lg font-black text-gray-900 tracking-tight">Khel <span className="text-amber-500">Pratibha</span></span>
                    </Link>

                    {/* Desktop Nav Links */}
                    <div className="hidden md:flex items-center gap-8">
                        <NavLink to="/" className={navLink} end>Home</NavLink>
                        <NavLink to="/leaderboard" className={navLink}>Leaderboard</NavLink>
                        {isAuthenticated && <>
                            <NavLink to="/dashboard" className={navLink}>Dashboard</NavLink>
                            <NavLink to="/feed" className={navLink}>Feed</NavLink>
                        </>}
                        {isAuthenticated && user?.role === 'admin' && (
                            <NavLink to="/admin" className={navLink}>
                                <span className="flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                                    Admin
                                </span>
                            </NavLink>
                        )}
                    </div>

                    {/* Right Side */}
                    <div className="hidden md:flex items-center gap-3">
                        {isAuthenticated ? (
                            <div className="relative" ref={profileRef}>
                                <button
                                    onClick={() => setProfileOpen(!profileOpen)}
                                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-50 transition-colors"
                                >
                                    <img
                                        src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=f59e0b&color=fff`}
                                        alt={user?.name}
                                        className="w-8 h-8 rounded-lg object-cover border-2 border-amber-100"
                                    />
                                    <div className="text-left">
                                        <p className="text-xs font-bold text-gray-800 leading-tight">{user?.name}</p>
                                        <p className="text-[10px] text-gray-400 capitalize">{user?.role}</p>
                                    </div>
                                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
                                </button>

                                {profileOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 animate-fadeIn">
                                        <Link to="/profile" onClick={() => setProfileOpen(false)}
                                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-600 transition-colors">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                                            My Profile
                                        </Link>
                                        <Link to="/dashboard" onClick={() => setProfileOpen(false)}
                                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-600 transition-colors">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                                            Dashboard
                                        </Link>
                                        <hr className="my-1 border-gray-100" />
                                        <button onClick={handleLogout}
                                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                                            Sign Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <Link to="/login" className="text-sm font-semibold text-gray-600 hover:text-amber-500 transition-colors px-3 py-2">
                                    Sign In
                                </Link>
                                <Link to="/register" className="text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 transition-colors px-4 py-2 rounded-lg shadow-sm">
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile Hamburger */}
                    <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {menuOpen
                                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/>}
                        </svg>
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {menuOpen && (
                <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
                    {[
                        { to: '/', label: 'Home' },
                        { to: '/leaderboard', label: 'Leaderboard' },
                        ...(isAuthenticated ? [
                            { to: '/dashboard', label: 'Dashboard' },
                            { to: '/feed', label: 'Community Feed' },
                            { to: '/profile', label: 'My Profile' },
                        ] : []),
                        ...(isAuthenticated && user?.role === 'admin' ? [{ to: '/admin', label: 'Admin Panel' }] : []),
                    ].map(({ to, label }) => (
                        <NavLink key={to} to={to} onClick={() => setMenuOpen(false)}
                            className={({ isActive }) =>
                                `block px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${isActive ? 'bg-amber-50 text-amber-600' : 'text-gray-700 hover:bg-gray-50'}`
                            }>
                            {label}
                        </NavLink>
                    ))}
                    {isAuthenticated ? (
                        <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            Sign Out
                        </button>
                    ) : (
                        <div className="flex gap-2 pt-2">
                            <Link to="/login" onClick={() => setMenuOpen(false)} className="flex-1 text-center py-2 text-sm font-semibold text-gray-700 border border-gray-200 rounded-lg">Sign In</Link>
                            <Link to="/register" onClick={() => setMenuOpen(false)} className="flex-1 text-center py-2 text-sm font-bold text-white bg-amber-500 rounded-lg">Get Started</Link>
                        </div>
                    )}
                </div>
            )}
        </nav>
    );
};

export default Navbar;