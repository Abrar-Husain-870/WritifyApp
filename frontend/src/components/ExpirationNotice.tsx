import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, ArrowRight } from 'lucide-react';

const ExpirationNotice: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Clear any local storage or session storage related to the user
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');
    }, []);

    return (
        <div className="min-h-screen bg-background flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-background to-background"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-500/5 rounded-full blur-3xl -z-10"></div>

            <div className="max-w-md w-full bg-card/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-border/50 p-8 text-center relative z-10">
                <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-amber-500/10 mb-6">
                    <Clock className="h-10 w-10 text-amber-500" />
                </div>
                
                <h2 className="text-3xl font-extrabold text-foreground mb-4">
                    Account Expired
                </h2>
                
                <div className="space-y-4 text-base text-muted-foreground mb-8 leading-relaxed">
                    <p>
                        Your account has been automatically deleted due to 6 months of inactivity, in accordance with our data retention policy.
                    </p>
                    <p>
                        This helps us maintain a clean database and protect user privacy. All your data, assignments, and portfolio have been permanently removed.
                    </p>
                </div>
                
                <div className="space-y-4">
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-11 px-8"
                    >
                        Create New Account <ArrowRight className="ml-2 h-4 w-4" />
                    </button>
                    
                    <p className="text-sm text-muted-foreground">
                        You can create a new account anytime using your university email.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ExpirationNotice;