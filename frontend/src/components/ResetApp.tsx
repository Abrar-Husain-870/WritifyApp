import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import { AlertTriangle, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '../utils/cn';

const ResetApp: React.FC = () => {
  const navigate = useNavigate();
  const [isResetting, setIsResetting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to reset the application? This will delete ALL assignments, ratings, and reset user ratings. This action cannot be undone.')) {
      return;
    }

    try {
      setIsResetting(true);
      setMessage(null);
      setError(null);

      const response = await fetch('http://localhost:5000/api/reset-app', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error('You are not authorized to perform this action');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setMessage(data.message);
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to reset application');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header title="Reset Application" />

      <main className="flex-1 max-w-3xl w-full mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-card rounded-xl border border-destructive/20 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border bg-destructive/5 flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <div>
              <h3 className="text-lg font-semibold text-destructive">
                Reset Application Data
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                This is a destructive action that cannot be undone.
              </p>
            </div>
          </div>
          
          <div className="p-6">
            <div className="mb-8">
              <p className="text-foreground">
                This action will permanently delete:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
                <li>All assignments and assignment requests</li>
                <li>All ratings and reviews</li>
                <li>Reset all user ratings to 0</li>
              </ul>
            </div>
            
            <button
              type="button"
              onClick={handleReset}
              disabled={isResetting}
              className={cn(
                "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 h-11 px-8",
                isResetting 
                  ? "bg-secondary text-secondary-foreground opacity-50 cursor-not-allowed" 
                  : "bg-destructive text-destructive-foreground shadow hover:bg-destructive/90"
              )}
            >
              {isResetting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Resetting...</>
              ) : (
                <><AlertTriangle className="mr-2 h-4 w-4" /> Reset Application</>
              )}
            </button>
            
            {message && (
              <div className="mt-6 p-4 bg-green-50 text-green-800 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800 rounded-lg flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">{message}</p>
                  <p className="text-sm mt-1 opacity-90">Redirecting to dashboard in a few seconds...</p>
                </div>
              </div>
            )}
            
            {error && (
              <div className="mt-6 p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <p className="font-medium">{error}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ResetApp;