import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ShieldCheck, ArrowRight, CheckCircle2, BookOpen } from 'lucide-react';
import DarkModeToggle from './DarkModeToggle';
import Logo from './Logo';

const Landing: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background flex flex-col font-sans selection:bg-primary/30">
            {/* Navigation Bar */}
            <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex h-20 items-center justify-between">
                        <Logo
                            showText={false}
                            iconClassName="h-16 w-28"
                            imageClassName="h-full w-full object-contain"
                        />
                        <div className="flex items-center gap-4">
                            <DarkModeToggle />
                            <button
                                onClick={() => navigate('/login')}
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4"
                            >
                                Sign In
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative py-20 lg:py-32 overflow-hidden">
                    <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"></div>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground mb-6">
                            The Ultimate <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">Assignment Marketplace</span> for Students
                        </h1>
                        <p className="mt-4 text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
                            Connect with talented peers to get help with your assignments, or monetize your own writing skills. Exclusively for university students.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <button
                                onClick={() => navigate('/login')}
                                className="inline-flex items-center justify-center rounded-full text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 h-14 px-8"
                            >
                                Get Started Now <ArrowRight className="ml-2 h-5 w-5" />
                            </button>
                            <button
                                onClick={() => {
                                    document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="inline-flex items-center justify-center rounded-full text-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-14 px-8"
                            >
                                Learn More
                            </button>
                        </div>
                    </div>
                </section>

                {/* The Problem & Our Solution */}
                <section id="about" className="py-20 bg-muted/30 border-y border-border/50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                            <div>
                                <h2 className="text-3xl font-bold text-foreground mb-6">The Problem We Solve</h2>
                                <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                                    University life is demanding. Students often find themselves overwhelmed with multiple assignments, lab files, and projects all due at the same time. On the other hand, many talented students are looking for ways to earn extra income using their academic skills.
                                </p>
                                <p className="text-lg text-muted-foreground leading-relaxed">
                                    Before Writify, finding reliable help meant asking around informally, risking scams on unverified platforms, or dealing with people outside the university who didn't understand the specific course requirements.
                                </p>
                            </div>
                            <div className="bg-card rounded-2xl p-8 border border-border shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-6 opacity-10">
                                    <ShieldCheck className="w-32 h-32 text-primary" />
                                </div>
                                <h3 className="text-2xl font-bold text-foreground mb-6 relative z-10">Our Solution</h3>
                                <ul className="space-y-4 relative z-10">
                                    {[
                                        "A secure, closed ecosystem exclusively for verified university students.",
                                        "Transparent rating system to ensure quality and build trust.",
                                        "Direct WhatsApp integration for seamless communication.",
                                        "Dual-role system: be a client today, be a writer tomorrow."
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />
                                            <span className="text-muted-foreground">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features */}
                <section className="py-20">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold text-foreground mb-4">Why Choose Writify?</h2>
                            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Built with the specific needs of university students in mind.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="bg-card p-8 rounded-2xl border border-border hover:border-primary/50 transition-colors">
                                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6">
                                    <Users className="h-6 w-6 text-blue-500" />
                                </div>
                                <h3 className="text-xl font-semibold text-foreground mb-3">Peer-to-Peer</h3>
                                <p className="text-muted-foreground">
                                    Connect directly with peers who have taken the same courses and understand exactly what professors are looking for.
                                </p>
                            </div>
                            
                            <div className="bg-card p-8 rounded-2xl border border-border hover:border-primary/50 transition-colors">
                                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-6">
                                    <ShieldCheck className="h-6 w-6 text-green-500" />
                                </div>
                                <h3 className="text-xl font-semibold text-foreground mb-3">Verified Community</h3>
                                <p className="text-muted-foreground">
                                    Access is strictly limited to students with valid university email addresses, ensuring a safe and accountable environment.
                                </p>
                            </div>

                            <div className="bg-card p-8 rounded-2xl border border-border hover:border-primary/50 transition-colors">
                                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6">
                                    <BookOpen className="h-6 w-6 text-purple-500" />
                                </div>
                                <h3 className="text-xl font-semibold text-foreground mb-3">Portfolio Showcase</h3>
                                <p className="text-muted-foreground">
                                    Writers can showcase their handwriting and previous work, allowing clients to choose the perfect match for their needs.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-20 bg-primary text-primary-foreground relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                        <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to simplify your academic life?</h2>
                        <p className="text-lg md:text-xl mb-10 opacity-90">
                            Join the Writify community today. Whether you need help or want to offer your skills, you're just one click away.
                        </p>
                        <button
                            onClick={() => navigate('/login')}
                            className="inline-flex items-center justify-center rounded-full text-lg font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-background text-primary shadow-xl hover:scale-105 h-16 px-10"
                        >
                            Sign In with University Email
                        </button>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-card py-8 border-t border-border">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-primary" />
                        <span className="font-semibold text-foreground">Writify</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        &copy; {new Date().getFullYear()} Writify. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default Landing;