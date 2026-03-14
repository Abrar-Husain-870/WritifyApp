import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Logo from './Logo';
import { API } from '../utils/api';
import { GuestContext } from '../App';
import { exitGuestMode } from '../utils/auth';
import { Search, ListTodo, ClipboardList, User as UserIcon, Star, BookOpen, AlertTriangle, ArrowRight, PlusCircle, Sparkles } from 'lucide-react';
import { cn } from '../utils/cn';

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
            setUser({
                id: 0,
                name: 'Guest User',
                email: 'guest@example.com'
            });
            setLoading(false);
            return;
        }
        
        fetch(`${API.baseUrl}/api/profile`, {
            credentials: 'include'
        })
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP error! Status: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            setUser(data);
            setLoading(false);
        })
        .catch(err => {
            console.error('Error fetching profile:', err);
            setLoading(false);
        });
    }, [isGuest]);

    const handleExitGuestMode = () => {
        exitGuestMode();
    };

    const cards = [
        {
            title: "Find a Writer",
            description: "Browse through our talented writers and find the perfect match for your assignment.",
            icon: Search,
            color: "bg-blue-500",
            lightColor: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
            borderColor: "hover:border-blue-500/30",
            onClick: () => navigate('/find-writer')
        },
        {
            title: "Browse Requests",
            description: "Browse open assignment requests and offer your writing services.",
            icon: ListTodo,
            color: "bg-green-500",
            lightColor: "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400",
            borderColor: "hover:border-green-500/30",
            onClick: () => navigate('/browse-requests')
        },
        {
            title: "My Assignments",
            description: "View and manage your current and completed assignments.",
            icon: ClipboardList,
            color: "bg-amber-500",
            lightColor: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
            borderColor: "hover:border-amber-500/30",
            onClick: () => navigate('/my-assignments')
        },
        {
            title: "My Profile",
            description: "View and update your profile information and portfolio.",
            icon: UserIcon,
            color: "bg-purple-500",
            lightColor: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400",
            borderColor: "hover:border-purple-500/30",
            onClick: () => navigate('/profile')
        },
        {
            title: "My Ratings",
            description: "View and manage ratings you've received from clients.",
            icon: Star,
            color: "bg-yellow-500",
            lightColor: "bg-yellow-50 text-yellow-600 dark:bg-yellow-500/10 dark:text-yellow-400",
            borderColor: "hover:border-yellow-500/30",
            onClick: () => navigate('/my-ratings')
        },
        {
            title: "Tutorial",
            description: "Learn how to use Writify effectively with our comprehensive guide.",
            icon: BookOpen,
            color: "bg-indigo-500",
            lightColor: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400",
            borderColor: "hover:border-indigo-500/30",
            onClick: () => navigate('/tutorial')
        }
    ];

    return (
        <div className="min-h-screen bg-background flex flex-col font-sans">
            <Header title="Dashboard" showBackButton={false} />

            {isGuest && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-900/50 px-4 py-3">
                    <div className="max-w-7xl mx-auto flex items-start sm:items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5 sm:mt-0" />
                        <div className="flex-1 sm:flex sm:items-center sm:justify-between">
                            <p className="text-sm text-amber-800 dark:text-amber-200">
                                <strong className="font-semibold mr-1">Guest Mode Active.</strong>
                                You are browsing with limited access. Some features are disabled.
                            </p>
                            <button
                                onClick={handleExitGuestMode}
                                className="mt-2 sm:mt-0 text-sm font-semibold text-amber-800 dark:text-amber-200 hover:text-amber-900 dark:hover:text-amber-100 underline underline-offset-2 transition-colors"
                            >
                                Sign in for full access
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <main className="flex-1 max-w-7xl w-full mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
                {/* Welcome Banner */}
                <div className="relative overflow-hidden rounded-3xl bg-card border border-border shadow-sm">
                    <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    
                    <div className="relative p-8 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                                <Sparkles className="h-4 w-4" />
                                <span>Welcome back</span>
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-2">
                                {loading ? <Skeleton className="h-10 w-64 mb-2" /> : `Hello, ${user?.name?.split(' ')[0] || 'Student'}! 👋`}
                            </h1>
                            <div className="text-lg text-muted-foreground max-w-xl">
                                {loading ? <Skeleton className="h-6 w-full max-w-md" /> : 'Ready to tackle your assignments? Find the perfect writer or start earning by helping others.'}
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
                            <button 
                                onClick={() => navigate('/create-assignment')}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-6 py-3.5 text-sm font-semibold shadow-md hover:bg-primary/90 transition-all hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                                <PlusCircle className="h-5 w-5" />
                                Post Assignment
                            </button>
                            <button 
                                onClick={() => navigate('/find-writer')}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-secondary text-secondary-foreground px-6 py-3.5 text-sm font-semibold shadow-sm hover:bg-secondary/80 border border-border/50 transition-all hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                                <Search className="h-5 w-5" />
                                Find Writer
                            </button>
                        </div>
                    </div>
                </div>

                {/* Quick Actions Grid */}
                <div>
                    <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
                        Quick Actions
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {cards.map((card, index) => (
                            <div 
                                key={index}
                                onClick={card.onClick}
                                className={cn(
                                    "group relative bg-card overflow-hidden rounded-2xl border border-border/60 shadow-sm transition-all duration-300 hover:shadow-md cursor-pointer flex flex-col h-full",
                                    card.borderColor,
                                    "hover:-translate-y-1"
                                )}
                            >
                                <div className="p-6 flex-grow flex flex-col">
                                    <div className="flex items-center justify-between mb-5">
                                        <div className={cn("inline-flex p-3.5 rounded-xl transition-transform duration-300 group-hover:scale-110", card.lightColor)}>
                                            <card.icon className="h-6 w-6" />
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-2 group-hover:translate-x-0">
                                            <ArrowRight className="h-4 w-4 text-foreground" />
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                                        {card.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed mt-auto">
                                        {card.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;