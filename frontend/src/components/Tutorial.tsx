import React from 'react';
import Header from './Header';
import { BookOpen, UserCircle, Search, FileText, Star, MessageCircle, Settings, Lightbulb, Mail } from 'lucide-react';

const Tutorial: React.FC = () => {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header title="Tutorial" />
            
            <main className="flex-1 max-w-4xl w-full mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                    <div className="p-6 sm:p-10">
                        <div className="text-center mb-10">
                            <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-4">
                                <BookOpen className="h-8 w-8 text-primary" />
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Writify App Tutorial</h1>
                            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                                Writify connects students who need help with assignments to skilled writers who can assist them.
                                This tutorial will guide you through all the features of the app and how to make the most of it.
                            </p>
                        </div>
                        
                        <div className="space-y-12">
                            {/* Getting Started */}
                            <section>
                                <div className="flex items-center gap-3 mb-6 pb-2 border-b border-border">
                                    <UserCircle className="h-6 w-6 text-primary" />
                                    <h2 className="text-2xl font-semibold text-foreground">Getting Started</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-muted/30 p-5 rounded-xl border border-border/50">
                                        <h3 className="text-lg font-medium text-foreground mb-3">Setting Up Your Profile</h3>
                                        <p className="text-sm text-muted-foreground mb-3">
                                            After signing in with your Google account, complete your profile by adding:
                                        </p>
                                        <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-4">
                                            <li>Your university stream (e.g., Computer Science, Business, etc.)</li>
                                            <li>Your WhatsApp number (required for writers who want to be active)</li>
                                            <li>If you're a writer, upload samples of your work to your portfolio</li>
                                        </ul>
                                    </div>
                                    
                                    <div className="bg-muted/30 p-5 rounded-xl border border-border/50">
                                        <h3 className="text-lg font-medium text-foreground mb-3">Writer Status</h3>
                                        <p className="text-sm text-muted-foreground mb-3">
                                            Writers have three status options:
                                        </p>
                                        <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-4">
                                            <li><strong className="text-foreground">Inactive</strong>: Default status for new users. You won't appear in the writer search.</li>
                                            <li><strong className="text-foreground">Available</strong>: You're open to taking new assignments. <em>(Requires WhatsApp number)</em></li>
                                            <li><strong className="text-foreground">Busy</strong>: You're currently handling assignments but still visible in search. <em>(Requires WhatsApp number)</em></li>
                                        </ul>
                                    </div>
                                </div>
                            </section>
                            
                            {/* For Students */}
                            <section>
                                <div className="flex items-center gap-3 mb-6 pb-2 border-b border-border">
                                    <Search className="h-6 w-6 text-blue-500" />
                                    <h2 className="text-2xl font-semibold text-foreground">For Students</h2>
                                </div>
                                <div className="space-y-6">
                                    <div className="flex gap-4">
                                        <div className="shrink-0 mt-1">
                                            <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 font-bold">1</div>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-medium text-foreground mb-2">Finding a Writer</h3>
                                            <ol className="space-y-2 text-sm text-muted-foreground list-decimal pl-4">
                                                <li>Click on "Find a Writer" from the dashboard</li>
                                                <li>Browse through the list of available writers</li>
                                                <li>Click on a writer's card to view their full profile, including their portfolio and ratings</li>
                                                <li>If you find a suitable writer, submit your assignment details</li>
                                                <li>Once the writer accepts, you'll be connected via WhatsApp to discuss details</li>
                                            </ol>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-4">
                                        <div className="shrink-0 mt-1">
                                            <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 font-bold">2</div>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-medium text-foreground mb-2">Submitting Assignment Requests</h3>
                                            <p className="text-sm text-muted-foreground mb-2">
                                                When submitting an assignment request, provide detailed information:
                                            </p>
                                            <ul className="space-y-1 text-sm text-muted-foreground list-disc pl-4 mb-2">
                                                <li>Course name and code</li>
                                                <li>Assignment type (essay, report, etc.)</li>
                                                <li>Number of pages required</li>
                                                <li>Deadline</li>
                                            </ul>
                                            <p className="text-sm text-muted-foreground italic">
                                                The system will calculate an estimated cost based on these details.
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-4">
                                        <div className="shrink-0 mt-1">
                                            <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 font-bold">3</div>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-medium text-foreground mb-2">Managing Your Assignments</h3>
                                            <p className="text-sm text-muted-foreground mb-2">
                                                Track all your assignment requests in the "My Assignments" section:
                                            </p>
                                            <ul className="space-y-1 text-sm text-muted-foreground list-disc pl-4">
                                                <li>View open requests that haven't been accepted yet</li>
                                                <li>See assigned requests that writers are working on</li>
                                                <li>Check completed assignments</li>
                                                <li>Rate writers after assignment completion</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </section>
                            
                            {/* For Writers */}
                            <section>
                                <div className="flex items-center gap-3 mb-6 pb-2 border-b border-border">
                                    <FileText className="h-6 w-6 text-green-500" />
                                    <h2 className="text-2xl font-semibold text-foreground">For Writers</h2>
                                </div>
                                <div className="space-y-6">
                                    <div className="flex gap-4">
                                        <div className="shrink-0 mt-1">
                                            <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-600 font-bold">1</div>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-medium text-foreground mb-2">Setting Up Your Writer Profile</h3>
                                            <p className="text-sm text-muted-foreground mb-2">
                                                To attract students to your services:
                                            </p>
                                            <ol className="space-y-2 text-sm text-muted-foreground list-decimal pl-4">
                                                <li>Add your WhatsApp number (required to be active or busy)</li>
                                                <li>Upload samples of your previous work to your portfolio</li>
                                                <li>Add a detailed description of your expertise and experience</li>
                                                <li>Set your status to "Available" when ready to take assignments</li>
                                            </ol>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-4">
                                        <div className="shrink-0 mt-1">
                                            <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-600 font-bold">2</div>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-medium text-foreground mb-2">Finding Assignments</h3>
                                            <p className="text-sm text-muted-foreground mb-2">
                                                There are two ways to get assignments:
                                            </p>
                                            <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-4">
                                                <li><strong className="text-foreground">Direct Requests</strong>: Students can find your profile and send you assignment requests</li>
                                                <li><strong className="text-foreground">Browse Requests</strong>: You can browse open assignment requests from the "Browse Requests" section and accept ones that match your skills</li>
                                            </ul>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-4">
                                        <div className="shrink-0 mt-1">
                                            <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-600 font-bold">3</div>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-medium text-foreground mb-2">Managing Your Assignments</h3>
                                            <p className="text-sm text-muted-foreground mb-2">
                                                Keep track of your assignments in the "My Assignments" section:
                                            </p>
                                            <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-4">
                                                <li>View all assignments you've accepted</li>
                                                <li>Mark assignments as completed when done</li>
                                                <li>Maintain good ratings by delivering quality work on time</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </section>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Ratings System */}
                                <section className="bg-muted/20 p-6 rounded-xl border border-border">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Star className="h-5 w-5 text-yellow-500" />
                                        <h2 className="text-xl font-semibold text-foreground">Ratings System</h2>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Writify uses a 5-star rating system to help maintain quality and trust in the community:
                                    </p>
                                    <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-4">
                                        <li>Students can rate writers after assignment completion</li>
                                        <li>Ratings are displayed on writer profiles as an average score</li>
                                        <li>Higher-rated writers typically attract more assignment requests</li>
                                        <li>Writers can build their reputation through consistently good work</li>
                                    </ul>
                                </section>
                                
                                {/* Communication */}
                                <section className="bg-muted/20 p-6 rounded-xl border border-border">
                                    <div className="flex items-center gap-3 mb-4">
                                        <MessageCircle className="h-5 w-5 text-green-500" />
                                        <h2 className="text-xl font-semibold text-foreground">Communication</h2>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Writify uses WhatsApp for direct communication between students and writers:
                                    </p>
                                    <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-4">
                                        <li>When an assignment request is accepted, both parties are connected via WhatsApp</li>
                                        <li>Use WhatsApp to discuss assignment details, share files, and ask questions</li>
                                        <li>WhatsApp numbers are required for writers to be active on the platform</li>
                                        <li>For privacy reasons, WhatsApp numbers are only shared when an assignment is accepted</li>
                                    </ul>
                                </section>
                            </div>
                            
                            {/* Account Management */}
                            <section>
                                <div className="flex items-center gap-3 mb-6 pb-2 border-b border-border">
                                    <Settings className="h-6 w-6 text-purple-500" />
                                    <h2 className="text-2xl font-semibold text-foreground">Account Management</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-muted/30 p-5 rounded-xl border border-border/50">
                                        <h3 className="text-lg font-medium text-foreground mb-3">Account Expiration</h3>
                                        <p className="text-sm text-muted-foreground mb-3">
                                            To optimize database usage, Writify implements an automatic data cleanup system:
                                        </p>
                                        <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-4">
                                            <li>User accounts are automatically deleted after 6 months of inactivity</li>
                                            <li>You'll receive a notification 15 days before your account is scheduled for deletion</li>
                                            <li>To keep your account active, simply continue using the application</li>
                                            <li>This policy helps us maintain a lean database and focus on active users</li>
                                        </ul>
                                    </div>
                                    
                                    <div className="bg-muted/30 p-5 rounded-xl border border-border/50">
                                        <h3 className="text-lg font-medium text-foreground mb-3">Updating Your Profile</h3>
                                        <p className="text-sm text-muted-foreground mb-3">
                                            You can update your profile information at any time:
                                        </p>
                                        <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-4">
                                            <li>Change your university stream</li>
                                            <li>Update your WhatsApp number</li>
                                            <li>Modify your writer status</li>
                                            <li>Update your portfolio with new work samples</li>
                                        </ul>
                                    </div>
                                </div>
                            </section>
                            
                            {/* Tips for Success */}
                            <section>
                                <div className="flex items-center gap-3 mb-6 pb-2 border-b border-border">
                                    <Lightbulb className="h-6 w-6 text-amber-500" />
                                    <h2 className="text-2xl font-semibold text-foreground">Tips for Success</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-amber-500/5 p-5 rounded-xl border border-amber-500/20">
                                        <h3 className="text-lg font-medium text-amber-700 dark:text-amber-500 mb-3">For Students</h3>
                                        <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-4">
                                            <li>Provide clear and detailed assignment requirements</li>
                                            <li>Set realistic deadlines with some buffer time</li>
                                            <li>Communicate promptly with your writer</li>
                                            <li>Leave honest ratings to help the community</li>
                                        </ul>
                                    </div>
                                    
                                    <div className="bg-amber-500/5 p-5 rounded-xl border border-amber-500/20">
                                        <h3 className="text-lg font-medium text-amber-700 dark:text-amber-500 mb-3">For Writers</h3>
                                        <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-4">
                                            <li>Keep your portfolio updated with your best work</li>
                                            <li>Set your status to "Busy" when you have enough assignments</li>
                                            <li>Deliver quality work on time to maintain good ratings</li>
                                            <li>Communicate professionally with students</li>
                                            <li>Only accept assignments you're confident you can complete well</li>
                                        </ul>
                                    </div>
                                </div>
                            </section>

                            {/* Contact Information */}
                            <section>
                                <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                                    <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                                        <Mail className="h-8 w-8 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-semibold text-foreground mb-2">Contact the Developer</h2>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            If you have any questions, feedback, or need assistance with the Writify application, please don't hesitate to reach out. I'm committed to improving Writify and providing the best experience possible.
                                        </p>
                                        <a 
                                            href="mailto:brainstormhusain@gmail.com" 
                                            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-10 px-6"
                                        >
                                            Email brainstormhusain@gmail.com
                                        </a>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Tutorial;