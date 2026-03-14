import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { API } from '../utils/api';
import { AlertCircle, Loader2, Quote, User } from 'lucide-react';
import { cn } from '../utils/cn';
import Logo from './Logo';

interface LoginProps {}

const Login: React.FC<LoginProps> = () => {
    const [loading, setLoading] = useState<boolean>(false);
    const [guestLoading, setGuestLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const forceParam = params.get('force');
        const errorParam = params.get('error');
        
        if (errorParam === 'unauthorized') {
            setError('Only university students with .student.iul.ac.in email can sign up!');
            clearAllCookies();
            localStorage.setItem('FORCE_LOGOUT', Date.now().toString());
            sessionStorage.setItem('FORCE_LOGOUT', Date.now().toString());
        } else if (forceParam === 'true') {
            localStorage.setItem('FORCE_LOGOUT', Date.now().toString());
            sessionStorage.setItem('FORCE_LOGOUT', Date.now().toString());
            clearAllCookies();
        } else {
            localStorage.removeItem('FORCE_LOGOUT');
            sessionStorage.removeItem('FORCE_LOGOUT');
            localStorage.removeItem('user_logged_out');
            sessionStorage.removeItem('manual_logout');
        }
        
        return () => setLoading(false);
    }, [location]);
    
    const clearAllCookies = () => {
        document.cookie.split(';').forEach(cookie => {
            const [name] = cookie.trim().split('=');
            if (!name) return;
            
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
            clearAllCookies();
            localStorage.removeItem('FORCE_LOGOUT');
            sessionStorage.removeItem('FORCE_LOGOUT');
            localStorage.removeItem('user_logged_out');
            sessionStorage.removeItem('manual_logout');
            sessionStorage.removeItem('GUEST_MODE');
            sessionStorage.removeItem('GUEST_USER');
            
            ['user', 'token', 'auth', 'session'].forEach(key => {
                localStorage.removeItem(key);
                sessionStorage.removeItem(key);
            });
            
            clearAllCookies();
            
            setTimeout(() => {
                clearAllCookies();
                window.location.href = `${API.auth.google}?t=${Date.now()}&force=true`;
            }, 300);
        } catch (error) {
            console.error('Authentication error occurred');
            setError('Failed to connect to authentication service');
            setLoading(false);
        }
    };
    
    const handleGuestLogin = () => {
        setGuestLoading(true);
        
        try {
            clearAllCookies();
            localStorage.removeItem('FORCE_LOGOUT');
            sessionStorage.removeItem('FORCE_LOGOUT');
            
            sessionStorage.setItem('GUEST_MODE', 'true');
            
            const guestUser = {
                id: 'guest-' + Date.now(),
                name: 'Guest User',
                email: 'guest@example.com',
                profile_picture: null,
                role: 'guest',
                writer_status: 'inactive',
                created_at: new Date().toISOString(),
                isGuest: true
            };
            
            sessionStorage.setItem('GUEST_USER', JSON.stringify(guestUser));
            window.location.href = '/dashboard';
        } catch (error) {
            console.error('Guest login error:', error);
            setError('Failed to continue as guest. Please try again.');
            setGuestLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex w-full bg-background font-sans">
            {/* Left Side - Branding/Visuals (Hidden on mobile) */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-zinc-950 text-white flex-col justify-between p-12">
                {/* Abstract Background Elements */}
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] mix-blend-screen"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/20 blur-[120px] mix-blend-screen"></div>
                
                {/* Logo */}
                <div className="relative z-10">
                    <Logo textClassName="text-white" />
                </div>

                {/* Content */}
                <div className="relative z-10 max-w-lg mt-auto mb-auto">
                    <Quote className="h-12 w-12 text-primary/40 mb-6" />
                    <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-6">
                        Your academic <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
                            success partner.
                        </span>
                    </h1>
                    <p className="text-lg text-zinc-400 leading-relaxed">
                        Join the exclusive community of university students. Get help with your assignments or monetize your writing skills in a secure, peer-to-peer marketplace.
                    </p>
                </div>

                {/* Footer */}
                <div className="relative z-10 text-sm text-zinc-500">
                    &copy; {new Date().getFullYear()} Writify. Exclusively for university students.
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex-1 flex flex-col justify-center items-center p-8 sm:p-12 lg:p-16 relative">
                <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background lg:hidden"></div>
                
                <div className="w-full max-w-md space-y-10">
                    {/* Mobile Logo */}
                    <div className="flex items-center justify-center lg:hidden mb-8">
                        <Logo />
                    </div>

                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold tracking-tight text-foreground mb-3">
                            Welcome back
                        </h2>
                        <p className="text-base text-muted-foreground">
                            Please sign in to your account to continue
                        </p>
                    </div>

                    <div className="space-y-6">
                        {error && (
                            <div className="rounded-xl bg-destructive/10 p-4 border border-destructive/20 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="text-sm font-semibold text-destructive">
                                        Authentication Error
                                    </h3>
                                    <div className="mt-1 text-sm text-destructive/90">
                                        <p>{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        <div className="space-y-4">
                            <button
                                onClick={handleGoogleLogin}
                                disabled={loading || guestLoading}
                                className={cn(
                                    "w-full flex justify-center items-center py-3.5 px-4 rounded-xl text-base font-medium transition-all duration-200",
                                    "bg-foreground text-background shadow-lg hover:bg-foreground/90 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                )}
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                                ) : (
                                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                                        <path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
                                    </svg>
                                )}
                                {loading ? 'Signing in...' : 'Continue with Google'}
                            </button>
                            
                            <div className="relative flex items-center py-4">
                                <div className="flex-grow border-t border-border"></div>
                                <span className="flex-shrink-0 mx-4 text-xs text-muted-foreground uppercase tracking-wider font-medium">Or</span>
                                <div className="flex-grow border-t border-border"></div>
                            </div>
                            
                            <button
                                onClick={handleGuestLogin}
                                disabled={loading || guestLoading}
                                className={cn(
                                    "w-full flex justify-center items-center py-3.5 px-4 rounded-xl text-base font-medium transition-all duration-200",
                                    "bg-card text-foreground shadow-sm hover:bg-accent border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                                    "disabled:opacity-50 disabled:cursor-not-allowed"
                                )}
                            >
                                {guestLoading ? (
                                    <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-muted-foreground" />
                                ) : (
                                    <User className="w-5 h-5 mr-3 text-muted-foreground" />
                                )}
                                {guestLoading ? 'Continuing...' : 'Continue as Guest'}
                            </button>
                        </div>

                        <div className="pt-6">
                            <div className="rounded-xl bg-muted/30 p-4 border border-border/50">
                                <p className="text-sm text-center text-muted-foreground leading-relaxed">
                                    Only university email accounts (<span className="font-semibold text-foreground">@student.iul.ac.in</span>) are allowed for full access.<br/>
                                    <span className="text-xs mt-2 block opacity-80">Guest mode provides limited access for demonstration purposes.</span>
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