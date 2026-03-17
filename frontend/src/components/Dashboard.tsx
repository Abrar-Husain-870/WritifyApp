import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import { API } from '../utils/api';
import { GuestContext } from '../App';
import { exitGuestMode } from '../utils/auth';
import { Search, ClipboardList, User as UserIcon, Star, BookOpen, AlertTriangle, ArrowRight, PlusCircle } from 'lucide-react';
import { Skeleton } from './ui/Skeleton';

interface User {
    id: number;
    name: string;
    email: string;
}

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const { isGuest } = useContext(GuestContext);

    useEffect(() => {
        if (isGuest) {
            setUser({ id: 0, name: 'Guest User', email: 'guest@example.com' });
            setLoading(false);
            return;
        }
        
        fetch(`${API.baseUrl}/api/profile`, { credentials: 'include' })
        .then(res => {
            if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
            return res.json();
        })
        .then(data => { setUser(data); setLoading(false); })
        .catch(() => { setLoading(false); });
    }, [isGuest]);

    const actions = [
        { title: "Find a Writer", description: "Browse writer profiles and portfolios to find the right match.", icon: Search, path: '/find-writer' },
        { title: "Browse Requests", description: "See open assignments from students looking for writers.", icon: BookOpen, path: '/browse-requests' },
        { title: "My Assignments", description: "Track progress on your current and completed work.", icon: ClipboardList, path: '/my-assignments' },
        { title: "My Profile", description: "Update your info, portfolio, and writer availability.", icon: UserIcon, path: '/profile' },
        { title: "My Ratings", description: "See the reviews and ratings you've received.", icon: Star, path: '/my-ratings' },
        { title: "Tutorial", description: "Learn how Writify works, step by step.", icon: BookOpen, path: '/tutorial' }
    ];

    return (
        <div className="min-h-screen bg-background flex flex-col font-sans">
            <Header title="Dashboard" showBackButton={false} />

            {isGuest && (
                <div className="border-b border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-950/30 px-4 py-2.5">
                    <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-200">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            <span><strong className="font-medium">Guest Mode.</strong> Some features are limited.</span>
                        </div>
                        <button onClick={exitGuestMode} className="text-sm font-medium text-amber-800 dark:text-amber-200 hover:underline underline-offset-2 shrink-0">
                            Sign in
                        </button>
                    </div>
                </div>
            )}

            <main className="flex-1 max-w-5xl w-full mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="mb-10">
                    {loading ? (
                        <>
                            <Skeleton className="h-7 w-56 mb-2" />
                            <Skeleton className="h-5 w-80" />
                        </>
                    ) : (
                        <>
                            <h1 className="text-xl font-semibold tracking-tight text-foreground mb-1">
                                Welcome back, {user?.name?.split(' ')[0] || 'Student'}
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Find the right writer or start earning by helping others.
                            </p>
                        </>
                    )}

                    <div className="flex gap-2 mt-5">
                        <button 
                            onClick={() => navigate('/find-writer')}
                            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-primary text-primary-foreground px-4 h-9 text-sm font-medium hover:bg-primary/90 transition-colors"
                        >
                            <PlusCircle className="h-3.5 w-3.5" />
                            Post Assignment
                        </button>
                        <button 
                            onClick={() => navigate('/find-writer')}
                            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border bg-background text-foreground px-4 h-9 text-sm font-medium hover:bg-accent transition-colors"
                        >
                            <Search className="h-3.5 w-3.5" />
                            Find Writer
                        </button>
                    </div>
                </div>

                <div>
                    <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {actions.map((action, index) => (
                            <button 
                                key={index}
                                onClick={() => navigate(action.path)}
                                className="group flex items-start gap-3 p-4 rounded-lg border border-border bg-card hover:border-foreground/15 transition-colors text-left"
                            >
                                <div className="shrink-0 mt-0.5">
                                    <action.icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" strokeWidth={1.5} />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-sm font-medium text-foreground flex items-center gap-1">
                                        {action.title}
                                        <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                        {action.description}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
