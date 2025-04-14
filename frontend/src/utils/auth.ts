/**
 * Authentication utilities for Writify
 * Handles login, logout, and session management
 */

// Helper function to clear all cookies
export const clearAllCookies = () => {
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
      });
    });
  });
};

/**
 * Completely clears all authentication state and forces a logout
 * This is more aggressive than a normal logout and should be used
 * when transitioning from guest mode to regular login
 */
export const forceLogout = () => {
  // Clear all cookies
  clearAllCookies();
  
  // Clear all localStorage items (except theme preference)
  const themePreference = localStorage.getItem('darkMode');
  localStorage.clear();
  if (themePreference) {
    localStorage.setItem('darkMode', themePreference);
  }
  
  // Clear all sessionStorage items
  sessionStorage.clear();
  
  // Set logout flags to prevent automatic login
  localStorage.setItem('FORCE_LOGOUT', 'true');
  sessionStorage.setItem('FORCE_LOGOUT', 'true');
  localStorage.setItem('user_logged_out', 'true');
  sessionStorage.setItem('manual_logout', 'true');
  
  // Force a hard redirect to login page with cache-busting parameter
  window.location.href = `/login?t=${Date.now()}&force=true`;
};

/**
 * Handles guest mode exit
 * Clears all guest-related data and redirects to login page
 */
export const exitGuestMode = () => {
  // Clear guest-specific flags
  sessionStorage.removeItem('GUEST_MODE');
  sessionStorage.removeItem('GUEST_USER');
  
  // Force a complete logout
  forceLogout();
};

/**
 * Handles normal user logout
 * Clears session and redirects to login page
 */
export const logout = async () => {
  try {
    // Call the logout API endpoint
    await fetch('/api/auth/logout', {
      method: 'GET',
      credentials: 'include'
    });
  } catch (error) {
    console.error('Error during logout API call:', error);
  }
  
  // Force logout regardless of API call success
  forceLogout();
};
