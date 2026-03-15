import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import DarkModeToggle from './DarkModeToggle';
import { GuestContext } from '../App';
import { logout, exitGuestMode as forceExitGuestMode } from '../utils/auth';
import { ArrowLeft, ClipboardList, User, LogOut } from 'lucide-react';
import { cn } from '../utils/cn';
import Logo from './Logo';

interface HeaderProps {
    title: string;
    showBackButton?: boolean;
}

const Header: React.FC<HeaderProps> = ({ title, showBackButton = true }) => {
    const navigate = useNavigate();
    const { isGuest } = useContext(GuestContext);

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
                        {!showBackButton ? (
                            <Logo
                                showText={false}
                                iconClassName="h-14 w-24"
                                imageClassName="h-full w-full object-contain"
                            />
                        ) : (
                            <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
                        )}
                    </div>
                    
                    <div className="flex items-center gap-2 sm:gap-4">
                        <DarkModeToggle />
                        
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
