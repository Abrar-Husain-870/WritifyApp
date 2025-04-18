// Working version - redeployed on April 14, 2025 with guest login feature
import React, { useState, useEffect, createContext } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';

import Login from './components/Login';
import Dashboard from './components/Dashboard';
import CreateAssignment from './components/CreateAssignment';
import FindWriter from './components/FindWriter';
import WriterProfile from './components/WriterProfile';
import BrowseRequests from './components/BrowseRequests';
import Profile from './components/Profile';
import MyAssignments from './components/MyAssignments';
import MyRatings from './components/MyRatings';
import Tutorial from './components/Tutorial';
import AccountDeleted from './components/AccountDeleted';
import { ThemeProvider } from './contexts/ThemeContext';
import { API } from './utils/api';
import { clearAllCookies, exitGuestMode as forceExitGuestMode } from './utils/auth';

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
          console.error('Error fetching auth status:', error);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error in auth check:', error);
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 dark:border-blue-400 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  // Render the appropriate content based on authentication status
  return (
    <ThemeProvider>
      <GuestContext.Provider value={{
        isGuest,
        setIsGuest,
        exitGuestMode: forceExitGuestMode
      }}>
        <Router>
          <Routes>
            <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
            <Route path="/account-deleted" element={<AccountDeleted />} />
            <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
            
            {/* Protected routes - only accessible if authenticated */}
            <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
            <Route path="/create-assignment" element={isAuthenticated && !isGuest ? <CreateAssignment /> : (isGuest ? <Navigate to="/dashboard" /> : <Navigate to="/login" />)} />
            <Route path="/find-writer" element={isAuthenticated ? <FindWriter /> : <Navigate to="/login" />} />
            <Route path="/writer-profile/:id" element={isAuthenticated ? <WriterProfile /> : <Navigate to="/login" />} />
            <Route path="/browse-requests" element={isAuthenticated ? <BrowseRequests /> : <Navigate to="/login" />} />
            <Route path="/profile" element={isAuthenticated && !isGuest ? <Profile /> : (isGuest ? <Navigate to="/dashboard" /> : <Navigate to="/login" />)} />
            <Route path="/my-assignments" element={isAuthenticated ? <MyAssignments /> : <Navigate to="/login" />} />
            <Route path="/my-ratings" element={isAuthenticated ? <MyRatings /> : <Navigate to="/login" />} />
            <Route path="/tutorial" element={isAuthenticated ? <Tutorial /> : <Navigate to="/login" />} />
          </Routes>
        </Router>
      </GuestContext.Provider>
    </ThemeProvider>
  );
}

export default App;
