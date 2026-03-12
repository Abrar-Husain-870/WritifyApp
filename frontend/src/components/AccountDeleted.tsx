import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, ArrowRight } from 'lucide-react';

const AccountDeleted: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Clear any local storage or session storage related to the user
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');
    }, []);

    return (
        <div className="min-h-screen bg-background flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-destructive/10 via-background to-background"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-destructive/5 rounded-full blur-3xl -z-10"></div>

            <div className="max-w-md w-full bg-card/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-border/50 p-8 text-center relative z-10">
                <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-destructive/10 mb-6">
                    <Trash2 className="h-10 w-10 text-destructive" />
                </div>
                
                <h2 className="text-3xl font-extrabold text-foreground mb-4">
                    Account Deleted
                </h2>
                
                <p className="text-base text-muted-foreground mb-8 leading-relaxed">
                    Your account and all associated data have been permanently removed from our system. We're sorry to see you go.
                </p>
                
                <div className="space-y-4">
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-11 px-8"
                    >
                        Return to Login <ArrowRight className="ml-2 h-4 w-4" />
                    </button>
                    
                    <p className="text-sm text-muted-foreground">
                        Changed your mind? You can always create a new account using your university email.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AccountDeleted;