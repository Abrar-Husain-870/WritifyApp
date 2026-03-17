import React from 'react';
import Header from './Header';
import Logo from './Logo';
import { UserCircle, Search, FileText, Star, MessageCircle, Settings, Lightbulb, Mail } from 'lucide-react';

const Section: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
    <section>
        <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-border">
            {icon}
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
        </div>
        {children}
    </section>
);

const Tutorial: React.FC = () => {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header title="Tutorial" />
            <main className="flex-1 max-w-3xl w-full mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-10">
                    <div className="flex justify-center mb-5"><Logo iconClassName="h-20 sm:h-24" /></div>
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground mb-2">Tutorial</h1>
                    <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
                        Writify connects students who need assignment help with skilled writers. Here's how to get started.
                    </p>
                </div>
                
                <div className="space-y-10">
                    <Section icon={<UserCircle className="h-4 w-4 text-muted-foreground" />} title="Getting Started">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="border border-border rounded-lg p-4 bg-card">
                                <h3 className="text-sm font-semibold text-foreground mb-2">Profile Setup</h3>
                                <ul className="space-y-1.5 text-sm text-muted-foreground">
                                    <li>Add your university stream</li>
                                    <li>Add WhatsApp number (required for writers)</li>
                                    <li>Upload portfolio samples if writing</li>
                                </ul>
                            </div>
                            <div className="border border-border rounded-lg p-4 bg-card">
                                <h3 className="text-sm font-semibold text-foreground mb-2">Writer Status</h3>
                                <ul className="space-y-1.5 text-sm text-muted-foreground">
                                    <li><strong className="text-foreground">Inactive</strong> — Hidden from search</li>
                                    <li><strong className="text-foreground">Available</strong> — Open to assignments</li>
                                    <li><strong className="text-foreground">Busy</strong> — Visible but at capacity</li>
                                </ul>
                            </div>
                        </div>
                    </Section>

                    <Section icon={<Search className="h-4 w-4 text-muted-foreground" />} title="For Students">
                        <div className="space-y-4">
                            {[
                                { step: '1', title: 'Find a Writer', items: ['Click "Find a Writer" from dashboard', 'Browse available writers', 'View profiles and portfolios', 'Submit assignment details', 'Connect via WhatsApp once accepted'] },
                                { step: '2', title: 'Submit Requests', items: ['Provide course name and code', 'Select assignment type', 'Specify pages and deadline', 'System calculates estimated cost'] },
                                { step: '3', title: 'Manage Assignments', items: ['Track open requests', 'Monitor assigned work', 'View completed assignments', 'Rate writers after completion'] }
                            ].map(s => (
                                <div key={s.step} className="flex gap-3">
                                    <div className="shrink-0 h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-foreground">{s.step}</div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-foreground mb-1">{s.title}</h3>
                                        <ol className="text-sm text-muted-foreground space-y-1 list-decimal pl-4">{s.items.map((item, i) => <li key={i}>{item}</li>)}</ol>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Section>

                    <Section icon={<FileText className="h-4 w-4 text-muted-foreground" />} title="For Writers">
                        <div className="space-y-4">
                            {[
                                { step: '1', title: 'Set Up Profile', items: ['Add WhatsApp number', 'Upload work samples', 'Describe your expertise', 'Set status to Available'] },
                                { step: '2', title: 'Get Assignments', items: ['Receive direct requests from students', 'Browse open requests in the marketplace', 'Accept assignments matching your skills'] },
                                { step: '3', title: 'Deliver & Earn', items: ['Track accepted assignments', 'Mark as complete when done', 'Maintain quality for good ratings'] }
                            ].map(s => (
                                <div key={s.step} className="flex gap-3">
                                    <div className="shrink-0 h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-foreground">{s.step}</div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-foreground mb-1">{s.title}</h3>
                                        <ol className="text-sm text-muted-foreground space-y-1 list-decimal pl-4">{s.items.map((item, i) => <li key={i}>{item}</li>)}</ol>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Section>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="border border-border rounded-lg p-4 bg-card">
                            <div className="flex items-center gap-2 mb-3">
                                <Star className="h-4 w-4 text-muted-foreground" />
                                <h3 className="text-sm font-semibold text-foreground">Ratings</h3>
                            </div>
                            <ul className="text-sm text-muted-foreground space-y-1">
                                <li>5-star rating system</li>
                                <li>Rate after assignment completion</li>
                                <li>Higher ratings attract more work</li>
                            </ul>
                        </div>
                        <div className="border border-border rounded-lg p-4 bg-card">
                            <div className="flex items-center gap-2 mb-3">
                                <MessageCircle className="h-4 w-4 text-muted-foreground" />
                                <h3 className="text-sm font-semibold text-foreground">Communication</h3>
                            </div>
                            <ul className="text-sm text-muted-foreground space-y-1">
                                <li>WhatsApp for direct messaging</li>
                                <li>Auto-connected upon acceptance</li>
                                <li>Numbers private until accepted</li>
                            </ul>
                        </div>
                    </div>

                    <Section icon={<Settings className="h-4 w-4 text-muted-foreground" />} title="Account">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="border border-border rounded-lg p-4 bg-card">
                                <h3 className="text-sm font-semibold text-foreground mb-2">Expiration</h3>
                                <ul className="text-sm text-muted-foreground space-y-1">
                                    <li>Auto-deleted after 6 months inactive</li>
                                    <li>15-day warning before deletion</li>
                                    <li>Log in to keep account active</li>
                                </ul>
                            </div>
                            <div className="border border-border rounded-lg p-4 bg-card">
                                <h3 className="text-sm font-semibold text-foreground mb-2">Profile Updates</h3>
                                <ul className="text-sm text-muted-foreground space-y-1">
                                    <li>Change stream anytime</li>
                                    <li>Update WhatsApp number</li>
                                    <li>Modify writer status</li>
                                    <li>Refresh portfolio samples</li>
                                </ul>
                            </div>
                        </div>
                    </Section>

                    <Section icon={<Lightbulb className="h-4 w-4 text-muted-foreground" />} title="Tips">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="border border-border rounded-lg p-4 bg-card">
                                <h3 className="text-sm font-semibold text-foreground mb-2">For Students</h3>
                                <ul className="text-sm text-muted-foreground space-y-1">
                                    <li>Provide clear requirements</li>
                                    <li>Set realistic deadlines</li>
                                    <li>Communicate promptly</li>
                                    <li>Leave honest ratings</li>
                                </ul>
                            </div>
                            <div className="border border-border rounded-lg p-4 bg-card">
                                <h3 className="text-sm font-semibold text-foreground mb-2">For Writers</h3>
                                <ul className="text-sm text-muted-foreground space-y-1">
                                    <li>Keep portfolio updated</li>
                                    <li>Set "Busy" when at capacity</li>
                                    <li>Deliver quality work on time</li>
                                    <li>Communicate professionally</li>
                                </ul>
                            </div>
                        </div>
                    </Section>

                    <div className="border border-border rounded-lg p-5 bg-card flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                        <Mail className="h-5 w-5 text-muted-foreground shrink-0" />
                        <div className="flex-1">
                            <h3 className="text-sm font-semibold text-foreground mb-0.5">Contact</h3>
                            <p className="text-xs text-muted-foreground">Questions or feedback? Reach out anytime.</p>
                        </div>
                        <a href="mailto:brainstormhusain@gmail.com" className="h-8 px-4 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium inline-flex items-center shrink-0">
                            Email
                        </a>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Tutorial;
