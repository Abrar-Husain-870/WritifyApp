import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { API } from '../utils/api';

interface LoginProps {}

const Login: React.FC<LoginProps> = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const location = useLocation();

    useEffect(() => {
        // Check for error in URL params
        const params = new URLSearchParams(location.search);
        const forceParam = params.get('force');
        const errorParam = params.get('error');
        
        // Handle unauthorized error first
        if (errorParam === 'unauthorized') {
            // Set error message for unauthorized emails
            setError('Only university students with .student.iul.ac.in email can sign up!');
            
            // Ensure we're completely logged out if there was an unauthorized attempt
            // This prevents the app from treating non-university emails as logged in
            clearAllCookies();
            
            // Always set logout flags for unauthorized errors to prevent auto-login
            localStorage.setItem('FORCE_LOGOUT', Date.now().toString());
            sessionStorage.setItem('FORCE_LOGOUT', Date.now().toString());
            
            return; // Exit early to prevent the next block from clearing the flags
        }
        
        // If there's a force parameter, maintain logout state
        if (forceParam === 'true') {
            // Set/refresh logout flags
            localStorage.setItem('FORCE_LOGOUT', Date.now().toString());
            sessionStorage.setItem('FORCE_LOGOUT', Date.now().toString());
            
            // Aggressively clear all cookies
            clearAllCookies();
        } else {
            // Only clear logout flags if there's no error and no force parameter
            // This allows normal login attempts
            localStorage.removeItem('FORCE_LOGOUT');
            sessionStorage.removeItem('FORCE_LOGOUT');
            localStorage.removeItem('user_logged_out');
            sessionStorage.removeItem('manual_logout');
        }
        
        // Cleanup loading state when component unmounts
        return () => setLoading(false);
    }, [location]);
    
    // Helper function to clear all cookies
    const clearAllCookies = () => {
        document.cookie.split(';').forEach(cookie => {
            const [name] = cookie.trim().split('=');
            if (!name) return;
            
            // Clear with multiple domain/path combinations
            const hostname = window.location.hostname;
            const hostnameWithoutWWW = hostname.startsWith('www.') ? hostname.substring(4) : hostname;
            const domainParts = hostname.split('.');
            const topDomain = domainParts.length > 1 ? 
                domainParts.slice(domainParts.length - 2).join('.') : hostname;
                
            const domains = [hostname, hostnameWithoutWWW, topDomain, '', null];
            const paths = ['/', '/api', '/auth', '/api/auth', '', null];
            
            domains.forEach(domain => {
                paths.forEach(path => {
                    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT` + 
                        (path ? `; path=${path}` : '') + 
                        (domain ? `; domain=${domain}` : '');
                        
                    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT` + 
                        (path ? `; path=${path}` : '') + 
                        (domain ? `; domain=${domain}` : '') + 
                        '; secure';
                });
            });
        });
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError(null);
        
        try {
            // First clear all cookies to ensure a fresh login
            clearAllCookies();
            
            // Clear ALL logout flags to ensure login works
            localStorage.removeItem('FORCE_LOGOUT');
            sessionStorage.removeItem('FORCE_LOGOUT');
            localStorage.removeItem('user_logged_out');
            sessionStorage.removeItem('manual_logout');
            
            // Also clear any other potential auth data
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            localStorage.removeItem('auth');
            sessionStorage.removeItem('user');
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('auth');
            
            // Add a small delay to ensure all clearing operations complete
            setTimeout(() => {
                // Redirect to Google OAuth with cache-busting parameter
                window.location.href = `${API.auth.google}?t=${Date.now()}`;
            }, 100);
        } catch (error) {
            console.error('Authentication error occurred');
            setError('Failed to connect to authentication service');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <div className="mx-auto w-40 h-40 mb-6 transform hover:scale-105 transition-transform duration-300">
                        <img src="/assets/writify-logo.png" alt="Writify Logo" className="w-full h-full object-contain drop-shadow-lg" />
                    </div>
                    <h2 className="mt-4 sm:mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                        Welcome to Writify
                    </h2>
                    <p className="mt-2 text-center text-sm sm:text-base text-gray-600 dark:text-gray-400">
                        Connect with academic writers or find assignments
                    </p>
                </div>
                <div className="mt-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm py-8 px-8 shadow-lg rounded-xl border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-xl">
                    <div className="space-y-6">
                        {error && (
                            <div className="rounded-md bg-red-50 dark:bg-red-900/70 p-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-red-400 dark:text-red-300" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                                            Authentication Error
                                        </h3>
                                        <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                                            <p>{error}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        <div className="flex flex-col items-center">
                            <p className="mb-6 text-sm text-gray-600 dark:text-gray-400 text-center">
                                Sign in with your Google account to access Writify
                            </p>
                            <button
                                onClick={handleGoogleLogin}
                                disabled={loading}
                                className={`w-full flex justify-center items-center py-3 px-6 border border-transparent rounded-lg shadow-md text-base font-medium text-white transition-all duration-300 transform hover:scale-105 hover:shadow-lg ${
                                    loading ? 'bg-blue-400 dark:bg-blue-500 cursor-not-allowed' : 'bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800'
                                }`}
                            >
                                {loading ? (
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                                        <path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
                                    </svg>
                                )}
                                {loading ? 'Signing in...' : 'Sign in with Google'}
                            </button>
                            
                            <div className="mt-8 text-center">
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Note: Only university email accounts (@student.iul.ac.in) are allowed to access this application
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;