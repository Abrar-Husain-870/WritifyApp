// Working version - redeployed on April 6, 2025
import React, { useState, useEffect } from 'react';
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
        console.log('Maintaining logout flags to prevent auto-login');
        // Refresh the logout flags to ensure they don't expire
        localStorage.setItem('FORCE_LOGOUT', Date.now().toString());
        sessionStorage.setItem('FORCE_LOGOUT', Date.now().toString());
      }
      
      return;
    }
    
    // Check authentication status when the app loads
    const checkAuthStatus = async (retryCount = 0) => {
      try {
        // Check for logout flags again before making the API call
        // This ensures we don't check auth status if the user has logged out
        const forceLogoutLS = localStorage.getItem('FORCE_LOGOUT');
        const forceLogoutSS = sessionStorage.getItem('FORCE_LOGOUT');
        const oldLogoutLS = localStorage.getItem('user_logged_out');
        const oldLogoutSS = sessionStorage.getItem('manual_logout');
        
        // If any logout flag is present, don't check auth status
        if (forceLogoutLS || forceLogoutSS || oldLogoutLS === 'true' || oldLogoutSS === 'true') {
          console.log('Logout flags detected, skipping auth check and treating as logged out');
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        console.log(`Checking auth status with API (attempt ${retryCount + 1}):`, API.auth.status);
        
        // Don't use cache-busting parameter as it triggers CORS preflight
        // Use the standard URL without modifications
        const authCheckUrl = API.auth.status;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const response = await fetch(authCheckUrl, {
          method: 'GET',
          credentials: 'include',
          signal: controller.signal
          // Don't add custom headers that might trigger CORS preflight
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Auth check failed with status: ${response.status}`);
        }
        
        const data = await response.json();
        // Removed detailed auth response logging for privacy
        
        // Verify that the user has a valid university email if they are authenticated
        if (data.isAuthenticated && data.user && data.user.email) {
          const email = data.user.email;
          // Check if the email is from the university domain
          // Make sure to use lowercase for case-insensitive comparison
          const emailLower = email.toLowerCase();
          const isValidUniversityEmail = emailLower.endsWith('@student.iul.ac.in');
          
          if (!isValidUniversityEmail) {
            console.log('Non-university email detected, redirecting to login');
            
            // Set logout flags to prevent automatic login attempts
            localStorage.setItem('FORCE_LOGOUT', Date.now().toString());
            sessionStorage.setItem('FORCE_LOGOUT', Date.now().toString());
            
            // Clear all cookies to ensure we're logged out
            clearAllCookies();
            
            setIsAuthenticated(false);
            
            // Redirect to login page with unauthorized error
            window.location.href = '/login?error=unauthorized&force=true';
            return;
          } else {
            console.log('Valid university email confirmed');
          }
        }
        
        // If we're not authenticated according to the server, set logout flags
        if (!data.isAuthenticated) {
          console.log('Server reports not authenticated, setting logout flags');
          localStorage.setItem('FORCE_LOGOUT', Date.now().toString());
          sessionStorage.setItem('FORCE_LOGOUT', Date.now().toString());
          setIsAuthenticated(false);
        } else {
          // Only set authenticated if we're actually authenticated
          // AND we don't have any logout flags
          setIsAuthenticated(true);
          
          // Clear any existing logout flags to ensure we stay logged in
          localStorage.removeItem('FORCE_LOGOUT');
          sessionStorage.removeItem('FORCE_LOGOUT');
          localStorage.removeItem('user_logged_out');
          sessionStorage.removeItem('manual_logout');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        
        // Properly type the error for TypeScript
        const err = error as Error;
        
        // Retry up to 2 times if the error is likely temporary (network issue)
        if (retryCount < 2 && (
          err.name === 'AbortError' || 
          (err.message && err.message.includes('NetworkError'))
        )) {
          console.log(`Retrying auth check (${retryCount + 1}/2)...`);
          setTimeout(() => checkAuthStatus(retryCount + 1), 1000); // Wait 1 second before retry
          return;
        }
        
        // If authentication check fails after retries, assume user is not authenticated
        setIsAuthenticated(false);
      } finally {
        if (retryCount === 0 || retryCount >= 2) {
          setIsLoading(false);
        }
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

  return (
    <ThemeProvider>
      <Router>
        <AppContent isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} />
      </Router>
    </ThemeProvider>
  );
}

// Separate component to access useLocation hook
const AppContent = ({ isAuthenticated, setIsAuthenticated }: { isAuthenticated: boolean | null, setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean | null>> }) => {
  const location = useLocation();
  
  // Reset authentication state when account-deleted page is accessed
  // or when there's an unauthorized error in the URL
  useEffect(() => {
    // Check for unauthorized error in URL params
    const params = new URLSearchParams(location.search);
    const errorParam = params.get('error');
    const forceParam = params.get('force');
    
    if (location.pathname === '/account-deleted' || errorParam === 'unauthorized') {
      console.log('Detected account-deleted page or unauthorized error, resetting authentication state');
      setIsAuthenticated(false);
      
      // If there's an unauthorized error and force parameter, set logout flags instead of clearing them
      if (errorParam === 'unauthorized' && forceParam === 'true') {
        console.log('Unauthorized error with force parameter, setting logout flags');
        localStorage.setItem('FORCE_LOGOUT', Date.now().toString());
        sessionStorage.setItem('FORCE_LOGOUT', Date.now().toString());
      } else if (location.pathname === '/account-deleted') {
        // Only clear logout flags for account deleted page
        console.log('Account deleted page, clearing logout flags');
        localStorage.removeItem('FORCE_LOGOUT');
        sessionStorage.removeItem('FORCE_LOGOUT');
        localStorage.removeItem('user_logged_out');
        sessionStorage.removeItem('manual_logout');
      }
      
      // Clear cookies
      clearAllCookies();
    }
  }, [location.pathname, location.search, setIsAuthenticated]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />} />
        <Route path="/find-writer" element={isAuthenticated ? <FindWriter /> : <Navigate to="/login" replace />} />
        <Route path="/writer/:id" element={isAuthenticated ? <WriterProfile /> : <Navigate to="/login" replace />} />
        <Route path="/browse-requests" element={isAuthenticated ? <BrowseRequests /> : <Navigate to="/login" replace />} />
        <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" replace />} />
        <Route path="/my-assignments" element={isAuthenticated ? <MyAssignments /> : <Navigate to="/login" replace />} />
        <Route path="/my-ratings" element={isAuthenticated ? <MyRatings /> : <Navigate to="/login" replace />} />
        <Route path="/tutorial" element={isAuthenticated ? <Tutorial /> : <Navigate to="/login" replace />} />
        <Route path="/account-deleted" element={<AccountDeleted />} />
        <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
        <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </div>
  );
};

export default App;
