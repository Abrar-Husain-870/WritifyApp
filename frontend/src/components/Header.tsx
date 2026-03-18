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
    { name: 'My Assignments', path: '/my-assignments' },
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
            <div className="w-full px-0">
                <div className="grid grid-cols-[auto,1fr,auto] items-center h-14 sm:h-16 w-full gap-2 sm:gap-4">
                    <div className="flex items-center gap-4">
                        {!showBackButton ? (
                            <Logo className="min-w-[120px] sm:min-w-[160px] lg:min-w-[180px]" iconClassName="h-10 sm:h-13 lg:h-14" />
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
                    </div>

                    <div className="hidden md:flex justify-center">
                        <nav className="flex items-center gap-0.5">
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

                    <div className="flex items-center gap-1 justify-self-end">
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
