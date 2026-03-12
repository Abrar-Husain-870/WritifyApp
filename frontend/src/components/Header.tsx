import React, { useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DarkModeToggle from './DarkModeToggle';
import { GuestContext } from '../App';
import { logout, exitGuestMode as forceExitGuestMode } from '../utils/auth';
import { ArrowLeft, ClipboardList, User, LogOut, Bell } from 'lucide-react';
import { cn } from '../utils/cn';
import { API } from '../utils/api';

interface Notification {
    id: number;
    title: string;
    message: string;
    is_read: boolean;
    created_at: string;
}

interface HeaderProps {
    title: string;
    showBackButton?: boolean;
}

const Header: React.FC<HeaderProps> = ({ title, showBackButton = true }) => {
    const navigate = useNavigate();
    const { isGuest } = useContext(GuestContext);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const notificationRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isGuest) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 60000); // Poll every minute
            return () => clearInterval(interval);
        }
    }, [isGuest]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await fetch(`${API.baseUrl}/api/notifications`, {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setNotifications(data);
            } else {
                console.error('Failed to fetch notifications, status:', response.status);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };

    const markAsRead = async (id: number) => {
        try {
            await fetch(`${API.baseUrl}/api/notifications/${id}/read`, {
                method: 'PUT',
                credentials: 'include'
            });
            setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const handleSignOut = () => {
        if (isGuest) {
            forceExitGuestMode();
            return;
        }
        logout();
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    <div className="flex items-center gap-4">
                        {showBackButton && (
                            <button
                                onClick={() => navigate('/dashboard')}
                                className={cn(
                                    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
                                    "hover:bg-accent hover:text-accent-foreground h-9 w-9"
                                )}
                            >
                                <ArrowLeft className="h-5 w-5" />
                                <span className="sr-only">Back</span>
                            </button>
                        )}
                        <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
                    </div>
                    
                    <div className="flex items-center gap-2 sm:gap-4">
                        <DarkModeToggle />

                        {!isGuest && (
                            <div className="relative" ref={notificationRef}>
                                <button
                                    onClick={() => setShowNotifications(!showNotifications)}
                                    className={cn(
                                        "relative inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
                                        "hover:bg-accent hover:text-accent-foreground h-9 w-9"
                                    )}
                                >
                                    <Bell className="h-5 w-5" />
                                    {notifications.filter(n => !n.is_read).length > 0 && (
                                        <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive"></span>
                                    )}
                                </button>

                                {showNotifications && (
                                    <div className="absolute right-0 mt-2 w-80 bg-card border border-border shadow-lg rounded-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                                        <div className="p-4 border-b border-border bg-muted/20 flex justify-between items-center">
                                            <h3 className="font-semibold text-foreground">Notifications</h3>
                                            <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                                                {notifications.filter(n => !n.is_read).length} new
                                            </span>
                                        </div>
                                        <div className="max-h-[400px] overflow-y-auto">
                                            {notifications.length === 0 ? (
                                                <div className="p-6 text-center text-muted-foreground text-sm">
                                                    No notifications yet
                                                </div>
                                            ) : (
                                                <div className="divide-y divide-border">
                                                    {notifications.map(notification => (
                                                        <div 
                                                            key={notification.id} 
                                                            className={cn(
                                                                "p-4 transition-colors hover:bg-muted/50",
                                                                !notification.is_read && "bg-primary/5"
                                                            )}
                                                            onClick={() => !notification.is_read && markAsRead(notification.id)}
                                                        >
                                                            <div className="flex justify-between items-start mb-1">
                                                                <h4 className="text-sm font-medium text-foreground">{notification.title}</h4>
                                                                {!notification.is_read && (
                                                                    <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0"></div>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-muted-foreground mb-2">{notification.message}</p>
                                                            <span className="text-[10px] text-muted-foreground/70">
                                                                {new Date(notification.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        <div className="h-4 w-px bg-border hidden sm:block mx-1" />

                        <button
                            onClick={() => navigate('/my-assignments')}
                            className={cn(
                                "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
                                "hover:bg-accent hover:text-accent-foreground h-9 w-9 sm:h-9 sm:px-4 sm:w-auto"
                            )}
                            title="My Assignments"
                        >
                            <ClipboardList className="h-5 w-5 sm:mr-2" />
                            <span className="hidden sm:inline-block">Assignments</span>
                        </button>

                        {!isGuest && (
                            <button
                                onClick={() => navigate('/profile')}
                                className={cn(
                                    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
                                    "hover:bg-accent hover:text-accent-foreground h-9 w-9 sm:h-9 sm:px-4 sm:w-auto"
                                )}
                                title="Profile"
                            >
                                <User className="h-5 w-5 sm:mr-2" />
                                <span className="hidden sm:inline-block">Profile</span>
                            </button>
                        )}

                        <button
                            onClick={handleSignOut}
                            className={cn(
                                "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
                                "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 h-9 px-4 ml-2"
                            )}
                        >
                            <LogOut className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline-block">{isGuest ? 'Exit Guest' : 'Sign Out'}</span>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
