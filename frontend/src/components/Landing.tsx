import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, ShieldCheck, PenTool, ArrowRight } from 'lucide-react';
import DarkModeToggle from './DarkModeToggle';
import Logo from './Logo';

const Landing: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background flex flex-col font-sans">
            <nav className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
                <div className="w-full px-0">
                    <div className="flex h-16 items-center justify-start">
                        <Logo className="min-w-[160px]" iconClassName="h-13 sm:h-14" />
                        <div className="ml-auto flex items-center gap-2">
                            <DarkModeToggle />
                            <button
                                onClick={() => navigate('/login')}
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors h-8 px-4"
                            >
                                Sign In
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="flex-1">
                <section className="pt-20 pb-24 lg:pt-28 lg:pb-32">
                    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-foreground leading-[1.12] mb-5">
                            The assignment marketplace for university students
                        </h1>
                        
                        <p className="text-base text-muted-foreground max-w-lg mx-auto mb-8 leading-relaxed">
                            Connect with talented peers for assignment help, or earn by offering your writing skills. Verified, secure, and built exclusively for your university.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
                            <button
                                onClick={() => navigate('/login')}
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors h-10 px-6 w-full sm:w-auto group"
                            >
                                Get Started
                                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                            </button>
                            <button
                                onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-border bg-background hover:bg-accent text-foreground transition-colors h-10 px-6 w-full sm:w-auto"
                            >
                                How it works
                            </button>
                        </div>
                    </div>
                </section>

                <section id="how" className="py-20 border-y border-border">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="max-w-lg mb-12">
                            <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-3">
                                How Writify works
                            </h2>
                            <p className="text-muted-foreground">
                                Three steps to get your assignment done by a verified peer.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                            {[
                                { step: "01", title: "Post your request", desc: "Describe the assignment, set a deadline, and name your price. It takes 30 seconds." },
                                { step: "02", title: "Get matched", desc: "Verified writers from your university see your request and offer to help. You pick who fits best." },
                                { step: "03", title: "Connect & complete", desc: "Discuss details over WhatsApp, get the work done, and leave a rating." }
                            ].map((item) => (
                                <div key={item.step}>
                                    <span className="text-xs font-medium text-muted-foreground tabular-nums">{item.step}</span>
                                    <h3 className="text-sm font-semibold text-foreground mt-2 mb-1.5">{item.title}</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="py-20">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
                            <div>
                                <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-4">
                                    Built different from random freelancing sites.
                                </h2>
                                <p className="text-muted-foreground leading-relaxed mb-6">
                                    Before Writify, finding reliable assignment help meant risking scams on unverified platforms. We built a closed ecosystem exclusively for your university.
                                </p>
                                <ul className="space-y-3">
                                    {[
                                        { title: "Verified network", desc: "Only students with valid university emails." },
                                        { title: "Transparent quality", desc: "Real ratings from real classmates." },
                                        { title: "Direct communication", desc: "Seamless WhatsApp integration." },
                                        { title: "Dual roles", desc: "Be a client today, a writer tomorrow." }
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-baseline gap-2.5">
                                            <span className="h-1 w-1 rounded-full bg-foreground shrink-0 mt-2" />
                                            <div>
                                                <span className="text-sm font-medium text-foreground">{item.title}</span>
                                                <span className="text-sm text-muted-foreground ml-1">— {item.desc}</span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                                {[
                                    { icon: Users, title: "Peer-to-Peer", desc: "Connect directly with peers who've taken the same courses and understand what professors expect." },
                                    { icon: ShieldCheck, title: "Verified Community", desc: "Access limited to students with valid university email addresses." },
                                    { icon: PenTool, title: "Portfolio Showcase", desc: "Writers showcase their handwriting and previous work so you choose the perfect match." }
                                ].map((feature, i) => (
                                    <div key={i} className="border border-border rounded-lg p-5 bg-card">
                                        <feature.icon className="h-4 w-4 text-muted-foreground mb-3" strokeWidth={1.5} />
                                        <h3 className="text-sm font-medium text-foreground mb-1">{feature.title}</h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="py-16 border-t border-border">
                    <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h2 className="text-xl font-semibold tracking-tight text-foreground mb-3">
                            Ready to get started?
                        </h2>
                        <p className="text-sm text-muted-foreground mb-6">
                            Join your university's assignment marketplace.
                        </p>
                        <button
                            onClick={() => navigate('/login')}
                            className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors h-10 px-6"
                        >
                            Sign In with University Email
                        </button>
                    </div>
                </section>
            </main>

            <footer className="border-t border-border py-6">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-3">
                    <Logo iconClassName="h-8" showText={true} textClassName="text-base font-semibold" />
                    <p className="text-xs text-muted-foreground">
                        &copy; {new Date().getFullYear()} Writify. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
