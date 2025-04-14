// Working version - redeployed on April 14, 2025 with guest login feature
import React, { useState, useEffect, createContext } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
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

// Create a context for guest mode
interface GuestContextType {
  isGuest: boolean;
  setIsGuest: React.Dispatch<React.SetStateAction<boolean>>;
}

export const GuestContext = createContext<GuestContextType>({
  isGuest: false,
  setIsGuest: () => {},
});

// Helper function to clear all cookies
const clearAllCookies = () => {
  document.cookie.split(';').forEach(cookie => {
    const [name] = cookie.trim().split('=');
    if (!name) return;
    
    // Clear with multiple domain/path combinations
    const hostname = window.location.hostname;
    const hostnameWithoutWWW = hostname.startsWith('www.') ? hostname.substring(4) : hostname;
    const domainParts = hostname.split('.');
    const topDomain = domainParts.length > 1 ? 
      domainParts.slice(domainParts.length - 2).join('.') : hostname;
      
    const domains = [hostname, hostnameWithoutWWW, topDomain, '', null];
    const paths = ['/', '/api', '/auth', '/api/auth', '', null];
    
    domains.forEach(domain => {
      paths.forEach(path => {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT` + 
          (path ? `; path=${path}` : '') + 
          (domain ? `; domain=${domain}` : '');
          
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT` + 
          (path ? `; path=${path}` : '') + 
          (domain ? `; domain=${domain}` : '') + 
          '; secure';
      });
    });
  });
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuest, setIsGuest] = useState<boolean>(
    sessionStorage.getItem('GUEST_MODE') === 'true'
  );

  useEffect(() => {
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
      const cookieNames = document.cookie.split(';').map(cookie => cookie.trim().split('=')[0]);
      cookieNames.forEach(name => {
        if (!name) return;
        
        // Clear with multiple domain/path combinations
        const hostname = window.location.hostname;
        const hostnameWithoutWWW = hostname.startsWith('www.') ? hostname.substring(4) : hostname;
        const domainParts = hostname.split('.');
        const topDomain = domainParts.length > 1 ? 
            domainParts.slice(domainParts.length - 2).join('.') : hostname;
            
        const domains = [hostname, hostnameWithoutWWW, topDomain, '', null];
        const paths = ['/', '/api', '/auth', '/api/auth', '', null];
        
        domains.forEach(domain => {
            paths.forEach(path => {
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT` + 
                    (path ? `; path=${path}` : '') + 
                    (domain ? `; domain=${domain}` : '');
                    
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT` + 
                    (path ? `; path=${path}` : '') + 
                    (domain ? `; domain=${domain}` : '') + 
                    '; secure';
            });
        });
      });
      
      // Set as not authenticated
      setIsAuthenticated(false);
      setIsLoading(false);
      
      // Keep the logout flags active to prevent auto-login on page refresh
      // Only clear them if we're on the login page and the user is actively trying to log in
      if (window.location.pathname === '/login' && !forceParam) {
        console.log('On login page, clearing logout flags to allow login attempt');
        localStorage.removeItem('FORCE_LOGOUT');
        sessionStorage.removeItem('FORCE_LOGOUT');
        localStorage.removeItem('user_logged_out');
        sessionStorage.removeItem('manual_logout');
      } else {
    const checkAuthStatus = async (retryCount = 0) => {
      try {
        // Check if we're in guest mode first
        if (sessionStorage.getItem('GUEST_MODE') === 'true') {
          console.log('Guest mode detected in session storage');
          setIsGuest(true);
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        }

        // Check for logout flags in storage
        const urlParams = new URLSearchParams(window.location.search);
        const forceParam = urlParams.get('force');
        const forceLogoutLS = localStorage.getItem('FORCE_LOGOUT');
        const forceLogoutSS = sessionStorage.getItem('FORCE_LOGOUT');
        const oldLogoutLS = localStorage.getItem('user_logged_out');
        const oldLogoutSS = sessionStorage.getItem('manual_logout');
        
        // If any logout flag is present, don't check auth status
        if (forceParam === 'true' || forceLogoutLS || forceLogoutSS || oldLogoutLS === 'true' || oldLogoutSS === 'true') {
          console.log('Logout flags detected, skipping auth check');
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

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
        console.error('Error checking auth status:', error);
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
      <GuestContext.Provider value={{ isGuest, setIsGuest }}>
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
