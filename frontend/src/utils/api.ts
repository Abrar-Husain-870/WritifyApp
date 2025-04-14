// API configuration
const isProduction = window.location.hostname !== 'localhost';
// Add type declaration for process
declare const process: {
  env: {
    REACT_APP_API_URL?: string;
    [key: string]: string | undefined;
  }
};

const API_URL = isProduction
  ? (process.env.REACT_APP_API_URL || 'https://writifyapp.onrender.com')
  : (process.env.REACT_APP_API_URL || 'http://localhost:5000');

// Common fetch options with credentials
const fetchOptions = {
  credentials: 'include' as RequestCredentials,
  headers: {
    'Content-Type': 'application/json'
  }
};

// API endpoints
export const API = {
  // Base URL
  baseUrl: API_URL,
  
  // Auth endpoints
  auth: {
    login: `${API_URL}/api/auth/login`,
    register: `${API_URL}/api/auth/register`,
    logout: `${API_URL}/auth/logout`, // Updated to use the correct endpoint
    googleLogin: `${API_URL}/api/auth/google`,
    me: `${API_URL}/api/auth/me`,
    status: `${API_URL}/auth/status`,
    google: `${API_URL}/auth/google`,
    guestLogin: `${API_URL}/auth/guest-login`,
  },
  
  // User endpoints
  users: {
    profile: `${API_URL}/api/profile`,
    updateProfile: `${API_URL}/api/profile`,
    updateWhatsApp: `${API_URL}/api/update-whatsapp`,
    updateWriterProfile: `${API_URL}/api/profile/writer`,
    updatePortfolio: `${API_URL}/api/profile/portfolio`,
    ratings: `${API_URL}/api/my-ratings`,
    deleteAccount: `${API_URL}/api/delete-account`,
  },
  
  // Writer endpoints
  writers: {
    all: `${API_URL}/api/writers`,
    byId: (id: number) => `${API_URL}/api/writers/${id}`,
    portfolio: (id: number) => `${API_URL}/api/writers/${id}/portfolio`,
  },
  
  // Assignment request endpoints
  assignmentRequests: {
    all: `${API_URL}/api/assignment-requests`,
    create: `${API_URL}/api/assignment-requests`,
    byId: (id: number) => `${API_URL}/api/assignment-requests/${id}`,
    accept: (id: number) => `${API_URL}/api/assignment-requests/${id}/accept`,
    delete: (id: number) => `${API_URL}/api/assignment-requests/${id}`,
  },
  
  // Assignment endpoints
  assignments: {
    all: `${API_URL}/api/assignments`,
    my: `${API_URL}/api/my-assignments`,
    byId: (id: number) => `${API_URL}/api/assignments/${id}`,
    submit: (id: number) => `${API_URL}/api/assignments/${id}/submit`,
    approve: (id: number) => `${API_URL}/api/assignments/${id}/approve`,
  },
  
  // Rating endpoints
  ratings: {
    submit: `${API_URL}/api/ratings`,
    byUserId: (id: number) => `${API_URL}/api/ratings/user/${id}`,
  },
};

export default API;
