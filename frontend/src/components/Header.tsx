import React, { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DarkModeToggle from './DarkModeToggle';
import { GuestContext } from '../App';
import { logout, exitGuestMode as forceExitGuestMode } from '../utils/auth';
import { ArrowLeft, LogOut, User } from 'lucide-react';
import { cn } from '../utils/cn';
import Logo from './Logo';

interface HeaderProps {
    title: string;
    showBackButton?: boolean;
}

const navItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Assignments', path: '/my-assignments' },
    { name: 'Find Writer', path: '/find-writer' },
    { name: 'Browse', path: '/browse-requests' },
];

const Header: React.FC<HeaderProps> = ({ title, showBackButton = true }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { isGuest } = useContext(GuestContext);

    const handleSignOut = () => {
        if (isGuest) { forceExitGuestMode(); return; }
        logout();
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-14 items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        {!showBackButton ? (
                            <Logo iconClassName="h-20 sm:h-22" />
                        ) : (
                            <div className="flex items-center gap-2.5">
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors h-8 w-8"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                </button>
                                <span className="text-sm font-medium text-foreground hidden sm:block">{title}</span>
                            </div>
                        )}

                        <nav className="hidden md:flex items-center gap-0.5 ml-6">
                            {navItems.map((item) => {
                                const isActive = location.pathname === item.path;
                                return (
                                    <button
                                        key={item.path}
                                        onClick={() => navigate(item.path)}
                                        className={cn(
                                            "px-3 py-1.5 text-sm rounded-md transition-colors relative",
                                            isActive
                                                ? "text-foreground font-medium"
                                                : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        {item.name}
                                        {isActive && (
                                            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-foreground rounded-full" />
                                        )}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                    
                    <div className="flex items-center gap-1">
                        <DarkModeToggle />

                        {!isGuest && (
                            <button
                                onClick={() => navigate('/profile')}
                                className={cn(
                                    "inline-flex items-center justify-center rounded-md text-sm transition-colors h-8 w-8 sm:w-auto sm:px-3 sm:gap-1.5",
                                    location.pathname === '/profile'
                                        ? "text-foreground font-medium"
                                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                                )}
                                title="Profile"
                            >
                                <User className="h-4 w-4" />
                                <span className="hidden sm:inline text-sm">Profile</span>
                            </button>
                        )}

                        <button
                            onClick={handleSignOut}
                            className="inline-flex items-center justify-center rounded-md text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors h-8 w-8 sm:w-auto sm:px-3 sm:gap-1.5"
                        >
                            <LogOut className="h-4 w-4" />
                            <span className="hidden sm:inline">{isGuest ? 'Exit' : 'Sign Out'}</span>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
