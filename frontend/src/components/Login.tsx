import React, { useState, useEffect, useContext } from 'react';
import { GuestContext } from '../App';
import { API } from '../utils/api';
import { clearAllCookies } from '../utils/auth';
import { Loader2, AlertCircle, ShieldCheck, User } from 'lucide-react';
import { cn } from '../utils/cn';
import Logo from './Logo';

const Login: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [guestLoading, setGuestLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { setIsGuest } = useContext(GuestContext);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const authError = urlParams.get('error');
        if (authError === 'unauthorized') {
            setError('Only university email addresses (@student.iul.ac.in) are allowed.');
        } else if (authError === 'auth_failed') {
            setError('Authentication failed. Please try again.');
        } else if (authError === 'locked') {
            setError('Your account has been temporarily locked. Please try again later.');
        }
        const forceParam = urlParams.get('force');
        if (forceParam === 'true') { clearAllCookies(); }
    }, []);

    const handleGoogleLogin = () => {
        setLoading(true);
        setError(null);
        localStorage.removeItem('FORCE_LOGOUT');
        sessionStorage.removeItem('FORCE_LOGOUT');
        localStorage.removeItem('user_logged_out');
        sessionStorage.removeItem('manual_logout');
        window.location.href = API.auth.google;
    };

    const handleGuestLogin = async () => {
        setGuestLoading(true);
        setError(null);
        try {
            localStorage.removeItem('FORCE_LOGOUT');
            sessionStorage.removeItem('FORCE_LOGOUT');
            localStorage.removeItem('user_logged_out');
            sessionStorage.removeItem('manual_logout');
            sessionStorage.setItem('GUEST_MODE', 'true');
            const guestUser = {
                id: 'guest-' + Date.now(), name: 'Guest User', email: 'guest@example.com',
                profile_picture: null, role: 'guest', writer_status: 'inactive',
                created_at: new Date().toISOString(), isGuest: true
            };
            sessionStorage.setItem('GUEST_USER', JSON.stringify(guestUser));
            setIsGuest(true);
            window.location.href = '/dashboard';
        } catch (err) {
            setError('Failed to enter guest mode. Please try again.');
            setGuestLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-background p-4 sm:p-8">
            <div className="w-full max-w-sm flex flex-col items-center">
                <div className="mb-10 animate-[fadeFloat_1s_ease-out_both]">
                    <Logo iconClassName="h-20 sm:h-24" />
                </div>
                
                <div className="w-full space-y-6">
                    <div className="text-center">
                        <h1 className="text-xl font-semibold tracking-tight text-foreground mb-1.5">
                            Sign in to Writify
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Connect with your university email
                        </p>
                    </div>

                    {error && (
                        <div className="rounded-md bg-destructive/10 p-3 border border-destructive/20 flex items-start gap-2.5">
                            <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                            <p className="text-sm text-destructive leading-relaxed">{error}</p>
                        </div>
                    )}
                    
                    <div className="space-y-2.5">
                        <button
                            onClick={handleGoogleLogin}
                            disabled={loading || guestLoading}
                            className={cn(
                                "w-full flex justify-center items-center h-10 px-4 rounded-md text-sm font-medium transition-colors",
                                "bg-primary text-primary-foreground hover:bg-primary/90",
                                "disabled:opacity-50 disabled:cursor-not-allowed"
                            )}
                        >
                            {loading ? (
                                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                            ) : (
                                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                            )}
                            {loading ? 'Signing in...' : 'Continue with Google'}
                        </button>

                        <button
                            onClick={handleGuestLogin}
                            disabled={loading || guestLoading}
                            className={cn(
                                "w-full flex justify-center items-center h-10 px-4 rounded-md text-sm font-medium transition-colors",
                                "bg-secondary text-secondary-foreground hover:bg-accent border border-border",
                                "disabled:opacity-50 disabled:cursor-not-allowed"
                            )}
                        >
                            {guestLoading ? (
                                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                            ) : (
                                <User className="w-4 h-4 mr-2 text-muted-foreground" />
                            )}
                            {guestLoading ? 'Continuing...' : 'Continue as Guest'}
                        </button>
                    </div>

                    <div className="flex items-start gap-2.5 pt-1">
                        <ShieldCheck className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Access is restricted to verified university accounts (<span className="font-medium text-foreground">@student.iul.ac.in</span>). Guest mode provides limited access.
                        </p>
                    </div>
                </div>
                
                <p className="mt-8 text-xs text-muted-foreground text-center">
                    By continuing, you agree to our <span className="underline cursor-pointer hover:text-foreground transition-colors">Terms</span> and <span className="underline cursor-pointer hover:text-foreground transition-colors">Privacy Policy</span>.
                </p>
            </div>
        </div>
    );
};

export default Login;
