// Working version - redeployed on April 14, 2025 with guest login feature
import React, { useState, useEffect, createContext } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AnimatedRoutes from './components/AnimatedRoutes';
import { ThemeProvider } from './contexts/ThemeContext';
import { Toaster } from 'sonner';
import { API } from './utils/api';
import { debugLog, errorLog } from './utils/logUtil';
import { clearAllCookies, exitGuestMode as forceExitGuestMode } from './utils/auth';
import { Loader2 } from 'lucide-react';

// Create a context for guest mode
interface GuestContextType {
  isGuest: boolean;
  setIsGuest: React.Dispatch<React.SetStateAction<boolean>>;
  exitGuestMode: () => void;
}

export const GuestContext = createContext<GuestContextType>({
  isGuest: false,
  setIsGuest: () => {},
  exitGuestMode: () => {}
});

// Helper function to completely clear all authentication state
export const clearAllAuthState = () => {
  // Clear all cookies
  clearAllCookies();
  
  // Clear all localStorage items
  localStorage.clear();
  
  // Clear all sessionStorage items
  sessionStorage.clear();
  
  // Set logout flags to prevent automatic login
  localStorage.setItem('FORCE_LOGOUT', 'true');
  sessionStorage.setItem('FORCE_LOGOUT', 'true');
  localStorage.setItem('user_logged_out', 'true');
  sessionStorage.setItem('manual_logout', 'true');
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuest, setIsGuest] = useState<boolean>(
    sessionStorage.getItem('GUEST_MODE') === 'true'
  );

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // First, check the URL for a force parameter that indicates a forced logout
        const urlParams = new URLSearchParams(window.location.search);
        const forceParam = urlParams.get('force');
        
        // Check for the FORCE_LOGOUT flag in both localStorage and sessionStorage
        const forceLogoutLS = localStorage.getItem('FORCE_LOGOUT');
        const forceLogoutSS = sessionStorage.getItem('FORCE_LOGOUT');
        
        // Also check for older logout flags for backward compatibility
        const oldLogoutLS = localStorage.getItem('user_logged_out');
        const oldLogoutSS = sessionStorage.getItem('manual_logout');
        
        // If any logout flag is present or force parameter is in URL, prevent automatic login
        if (forceParam === 'true' || forceLogoutLS || forceLogoutSS || oldLogoutLS === 'true' || oldLogoutSS === 'true') {
          console.log('Logout flag or force parameter detected, preventing automatic login');
          
          // Aggressively clear all auth-related cookies
          clearAllCookies();
          
          // Set as not authenticated
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        // Check if we're in guest mode first
        if (sessionStorage.getItem('GUEST_MODE') === 'true') {
          console.log('Guest mode detected in session storage');
          setIsGuest(true);
          setIsAuthenticated(true);
          setIsLoading(false);
          
          // Make sure we have a guest user object
          if (!sessionStorage.getItem('GUEST_USER')) {
            // Create a default guest user if missing
            const guestUser = {
              id: 'guest-' + Date.now(),
              name: 'Guest User',
              email: 'guest@example.com',
              profile_picture: null,
              role: 'guest',
              writer_status: 'inactive',
              created_at: new Date().toISOString(),
              isGuest: true
            };
            sessionStorage.setItem('GUEST_USER', JSON.stringify(guestUser));
          }
          return;
        }

        try {
          // Fetch auth status from server
          const response = await fetch(API.auth.status, {
            credentials: 'include'
          });

          if (!response.ok) {
            throw new Error('Failed to check authentication status');
          }

          const data = await response.json();
          debugLog('Auth status fetched successfully:', data);
          
          if (data.isAuthenticated) {
            // Check if this is a guest session
            if (data.user && data.user.isGuest) {
              setIsGuest(true);
            }
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(false);
          }
        } catch (error) {
          errorLog('Error fetching auth status:', error);
          setIsAuthenticated(false);
        }
      } catch (error) {
        errorLog('Error in auth check:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuthStatus();
  }, []);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground font-medium">Loading Writify...</p>
        </div>
      </div>
    );
  }

  // Render the appropriate content based on authentication status
  return (
    <ThemeProvider>
      <Toaster position="top-right" richColors closeButton />
      <GuestContext.Provider value={{
        isGuest,
        setIsGuest,
        exitGuestMode: forceExitGuestMode
      }}>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AnimatedRoutes isAuthenticated={isAuthenticated} isGuest={isGuest} />
        </Router>
      </GuestContext.Provider>
    </ThemeProvider>
  );
}

export default App;