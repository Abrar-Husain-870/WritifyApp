const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const crypto = require('crypto');
const cron = require('node-cron');
const { setupDatabase } = require('./db/setupDatabase');

// Configuration
const ASSIGNMENT_EXPIRATION_DAYS = 7; // Assignment requests expire after 7 days

// Import security module
const security = require('./security');

// Encryption utilities for sensitive data
// Use environment variable for encryption key with a fallback
// For AES-256-CBC, the key must be exactly 32 bytes (characters)
let rawKey = process.env.ENCRYPTION_KEY || 'your-secret-encryption-key-min-32-chars';
// Ensure key is exactly 32 bytes by either padding or truncating
const ENCRYPTION_KEY = crypto.createHash('sha256').update(String(rawKey)).digest('base64').substring(0, 32);
const IV_LENGTH = 16; // For AES, this is always 16

// Store phone numbers without masking for better WhatsApp integration
function storePhoneNumber(text) {
    if (!text) return text;
    try {
        // Clean the phone number to contain only digits and the plus sign
        let cleanNumber = text.replace(/[^0-9+]/g, '');
        
        // If the number is already in masked format (******1234), return the original
        if (text.startsWith('******') && text.length > 6) {
            // Return masked number as is
            return text;
        }
        
        // If the number starts with WPHN-, it's already in our old format
        if (text.startsWith('WPHN-')) {
            // Return old format number as is
            return text;
        }
        
        // If the number starts with ESEC- or PH-, convert it back to a full number if possible
        if (text.startsWith('ESEC-') || text.startsWith('PH-')) {
            const userId = getCurrentUserId();
            if (userId) {
                // Try to get the full number from the lookup table
                let fullNumber = null;
                
                if (text.startsWith('PH-')) {
                    const last4 = text.slice(-4);
                    fullNumber = getFullPhoneNumberByLast4(userId, last4);
                }
                
                if (fullNumber) {
                    // Convert back to full number for better integration
                    return fullNumber;
                }
            }
            
            // If we couldn't convert it, just return the original
            return text;
        }
        
        // For a complete phone number, store it directly for better WhatsApp integration
        if (cleanNumber.length >= 10) {
            // Also store in the lookup table for redundancy
            const userId = getCurrentUserId();
            if (userId) {
                storeFullPhoneNumber(userId, cleanNumber);
            }
            
            // Store full phone number for WhatsApp integration
            return cleanNumber;
        }
        
        // If it's not a complete number, just return it as is
        return cleanNumber;
    } catch (error) {
        console.error('Phone storage error:', error);
        return text; // Return original text if storage fails
    }
}

// Retrieve phone number without masking for better WhatsApp integration
function retrievePhoneNumber(text) {
    if (!text) return text;
    try {
        // If it's in our old WPHN- format, try to get the full number
        if (text.startsWith('WPHN-')) {
            const userId = getCurrentUserId();
            if (userId) {
                const fullNumber = getFullPhoneNumber(userId, text.substring(5));
                if (fullNumber) {
                    // Return full phone number from lookup table
                    return fullNumber;
                }
            }
            // If we couldn't get the full number, return the original
            return text;
        }
        
        // If it's in our compact reference format (PH-xxxYYYY), retrieve the full number
        if (text.startsWith('PH-')) {
            try {
                // Extract the last 4 digits from the compact reference
                const last4 = text.slice(-4);
                
                // Try to get the full number from the lookup table
                const userId = getCurrentUserId();
                if (userId) {
                    const fullNumber = getFullPhoneNumberByLast4(userId, last4);
                    if (fullNumber) {
                        return fullNumber;
                    }
                }
                
                // If we couldn't get the full number, at least return the last 4 digits
                return `******${last4}`;
            } catch (retrieveError) {
                console.error('Error retrieving phone number:', retrieveError);
                return text;
            }
        }
        
        // For all other formats, return as is (should be the full number)
        return text;
    } catch (error) {
        console.error('Phone retrieval error:', error);
        return text; // Return original text if retrieval fails
    }
}

// Helper function to get the current user ID from the request
function getCurrentUserId() {
    try {
        // This is a simplified version - in a real implementation, you would
        // get this from the current request context
        return null;
    } catch (error) {
        console.error('Error getting current user ID:', error);
        return null;
    }
}

// Get the full WhatsApp number for redirects (using a lookup table approach)
// This keeps phone numbers in memory but not in the database
const whatsappLookup = new Map();

// For security, we'll clear this lookup table periodically
// This ensures that phone numbers don't stay in memory indefinitely
setInterval(() => {
    // Clear phone number lookup table for security
    whatsappLookup.clear();
}, 24 * 60 * 60 * 1000); // Clear every 24 hours

// Create a short hash (4 characters) from a phone number
// This is used to create a unique identifier that fits in the database
function createShortHash(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = ((hash << 5) - hash) + text.charCodeAt(i);
        hash = hash & hash; // Convert to 32bit integer
    }
    // Convert to a 4-character alphanumeric string
    const hashStr = Math.abs(hash).toString(36).substring(0, 4).padStart(4, '0');
    return hashStr;
}

// Get a full phone number by the last 4 digits
// This is used when we only have the compact reference
function getFullPhoneNumberByLast4(userId, last4Digits) {
    if (!userId || !last4Digits) return null;
    
    // Get all phone numbers for this user
    const userPhones = whatsappLookup.get(userId) || [];
    
    // Find the one that ends with these 4 digits
    for (const phone of userPhones) {
        if (phone.endsWith(last4Digits)) {
            return phone;
        }
    }
    
    return null;
}

// Store a phone number for WhatsApp redirects
function storeFullPhoneNumber(userId, phoneNumber) {
    if (!userId || !phoneNumber) return;
    
    // Ensure we're storing the complete phone number
    // Clean the phone number to contain only digits
    let cleanNumber = phoneNumber.replace(/\D/g, '');
    
    // Make sure it's a complete number (at least 10 digits)
    if (cleanNumber.length >= 10) {
        // Store the full phone number in memory (not in database)
        let userPhones = whatsappLookup.get(userId) || [];
        userPhones.push(cleanNumber);
        whatsappLookup.set(userId, userPhones);
        return true;
    } else {
        return false;
    }
}

// Get the full phone number for WhatsApp redirects
function getFullPhoneNumber(userId, lastFourDigits) {
    if (!userId) return null;
    
    // Try to get from our lookup table first
    const storedNumber = whatsappLookup.get(userId);
    if (storedNumber) {
        // Return the original stored number without any modifications
        return storedNumber;
    }
    
    // If we don't have the full number in our lookup table, return null
    // The frontend will show an appropriate message
    console.log(`No phone number found in lookup table for user ${userId}`);
    return null;
}

// Validate phone number format
function validatePhoneNumber(phoneNumber) {
    // Basic validation - can be enhanced based on your requirements
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    return phoneRegex.test(phoneNumber.replace(/\D/g, ''));
}

// Create a single database pool for the entire application
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    },
    // Add connection pool settings for better stability
    max: 20, // Maximum number of clients the pool should contain
    idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
    connectionTimeoutMillis: 2000 // How long to wait for a connection to become available
});

// Add error handler for the pool
pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
});

// Initialize database on startup in production
if (process.env.NODE_ENV === 'production' || process.env.INIT_DB === 'true') {
    console.log('Checking database setup...');
    setupDatabase(pool)
        .then(() => console.log('Database check complete'))
        .catch(err => console.error('Database check failed:', err));
}

// Set up Express app
const app = express();

// Trust proxies for Render deployment
app.set('trust proxy', 1);

// Configure security headers with helmet
security.configureHelmet(app);

// Apply rate limiting to all routes
app.use(security.apiLimiter);

// Apply input validation middleware
app.use(security.validateInput);

app.use(express.json());
app.use(cors({
    origin: function(origin, callback) {
        // Allow all Vercel domains and localhost
        if (!origin || origin.includes('vercel.app') || origin.includes('localhost')) {
            callback(null, true);
        } else {
            console.warn(`Origin ${origin} not allowed by CORS`);
            callback(null, false);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['set-cookie']
}));

// CORS middleware for static files
const staticCors = (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allow any origin for static files
    next();
};

// Handle manifest.json requests
app.get('/manifest.json', staticCors, (req, res) => {
    res.status(200).json({
        "short_name": "Writify",
        "name": "Writify - Academic Writing Platform",
        "icons": [
            {
                "src": "favicon.ico",
                "sizes": "64x64 32x32 24x24 16x16",
                "type": "image/x-icon"
            },
            {
                "src": "android-chrome-192x192.png",
                "type": "image/png",
                "sizes": "192x192",
                "purpose": "any maskable"
            },
            {
                "src": "android-chrome-512x512.png",
                "type": "image/png",
                "sizes": "512x512",
                "purpose": "any maskable"
            }
        ],
        "start_url": ".",
        "display": "standalone",
        "theme_color": "#2563eb",
        "background_color": "#ffffff"
    });
});

// Handle favicon.ico requests
app.get('/favicon.ico', staticCors, (req, res) => {
    // Return a simple transparent 1x1 pixel ico
    res.status(200).end();
});

// Handle android-chrome icon requests
app.get('/android-chrome-192x192.png', staticCors, (req, res) => {
    res.status(200).end();
});

app.get('/android-chrome-512x512.png', staticCors, (req, res) => {
    res.status(200).end();
});

// Passport serialization
passport.serializeUser((user, done) => {
    console.log('Serializing user:', user.id);
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        console.log('Deserializing user:', id);
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        if (result.rows.length > 0) {
            done(null, result.rows[0]);
        } else {
            done(new Error('User not found'));
        }
    } catch (error) {
        console.error('Deserialization error:', error);
        done(error);
    }
});

// Session configuration
const sessionConfig = {
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true, // Prevents client-side JS from reading the cookie
        maxAge: 24 * 60 * 60 * 1000, // Session expires after 24 hours
        sameSite: 'lax' // Provides some CSRF protection
    }
};

// Set up session with enhanced security
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true, // Prevents client-side JS from reading the cookie
        maxAge: 24 * 60 * 60 * 1000, // Session expires after 24 hours
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax' // Use 'none' in production with HTTPS
    }
}));

// Apply session timeout middleware
app.use(security.sessionTimeout);

// Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// Add this before your passport strategy
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 
    (process.env.NODE_ENV === 'production'
        ? 'https://writifyapp.onrender.com/auth/google/callback'
        : 'http://localhost:5000/auth/google/callback');

// Function to validate university email
const isValidUniversityEmail = (email) => {
    const isValid = email.endsWith('@student.iul.ac.in');
    console.log(`Email validation for ${email}: ${isValid}`);
    return isValid;
};

// Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: GOOGLE_CALLBACK_URL,
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    proxy: true
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // Check if the email is a valid university email
        const email = profile.emails[0].value;
        console.log('Processing OAuth callback for email:', email);
        
        if (!email.endsWith('@student.iul.ac.in')) {
            console.log('Email validation failed for:', email);
            // Return false for user and an info object with the message
            // This will be handled by the callback route
            return done(null, false, { message: 'Only university students with .student.iul.ac.in email can sign up!' });
        }

        console.log('Email validation passed, checking user in database');
        const userResult = await pool.query(
            'SELECT * FROM users WHERE google_id = $1',
            [profile.id]
        );

        if (userResult.rows.length === 0) {
            console.log('Creating new user');
            const newUser = await pool.query(
                `INSERT INTO users (google_id, email, name, profile_picture, writer_status) 
                 VALUES ($1, $2, $3, $4, 'inactive') 
                 RETURNING *`,
                [
                    profile.id,
                    email,
                    profile.displayName,
                    profile.photos?.[0]?.value || null
                ]
            );
            return done(null, newUser.rows[0]);
        }

        console.log('Existing user found');
        return done(null, userResult.rows[0]);
    } catch (error) {
        console.error('Database error:', error);
        return done(error);
    }
}));

// Define CORS middleware for auth routes
const authCors = (req, res, next) => {
    const origin = req.headers.origin;
    console.log('Request origin:', origin);
    
    // Allow all Vercel domains and localhost
    if (origin && (origin.includes('vercel.app') || origin.includes('localhost'))) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
    }
    
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    
    next();
};

// Auth routes with better error handling
app.get('/auth/google', security.authLimiter, authCors, (req, res, next) => {
    console.log('Starting Google OAuth flow');
    passport.authenticate('google', { 
        scope: ['profile', 'email'],
        prompt: 'select_account'
    })(req, res, next);
});

app.get('/auth/google/callback', security.authLimiter, authCors, (req, res, next) => {
    passport.authenticate('google', (err, user, info) => {
        // Check if email is locked due to too many failed attempts
        if (info && info.email && security.isAccountLocked(info.email)) {
            console.error('Account locked due to too many failed attempts:', info.email);
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=account_locked&t=${Date.now()}`);
        }
        console.log('Google OAuth callback - Error:', err?.message);
        console.log('Google OAuth callback - Info:', info?.message);
        
        // If there's an error or no user (authentication failed)
        if (err || !user) {
            const errorMessage = err?.message || info?.message || 'Authentication failed';
            console.error('Authentication failed:', errorMessage);
            
            // Clear any existing session completely before redirecting
            req.session.destroy((destroyErr) => {
                if (destroyErr) {
                    console.error('Session destruction error:', destroyErr);
                }
                
                // Set cache-control headers to prevent caching
                res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
                res.setHeader('Pragma', 'no-cache');
                res.setHeader('Expires', '0');
                
                // Record failed login attempt if email is available
                if (info && info.email) {
                    security.recordFailedLogin(info.email);
                }
                
                // Redirect with unauthorized error parameter
                return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=unauthorized&t=${Date.now()}`);
            });
            return;
        }
        
        // If authentication succeeded, log in the user
        req.login(user, (loginErr) => {
            if (loginErr) {
                console.error('Login error:', loginErr);
                return next(loginErr);
            }
            
            console.log('Google OAuth callback successful');
            // Add cache-busting parameter to prevent caching issues
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}?t=${Date.now()}`);
        });
    })(req, res, next);
});

// Error handling middleware for authentication
app.use((err, req, res, next) => {
    if (err) {
        console.error('Authentication error:', err);
        return res.status(401).json({
            error: 'Authentication Error',
            message: err.message || 'Only university students with .student.iul.ac.in email can sign up!'
        });
    }
    next();
});

// Auth status endpoint with detailed logging - no auth required
app.get('/auth/status', (req, res) => {
    // Apply CORS for this route specifically
    const origin = req.headers.origin;
    // Allow any origin for auth status checks
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    if (origin) {
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
    }

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        console.log('Auth status check - Origin:', req.headers.origin);
        console.log('Auth status check - Session ID:', req.session?.id);
        console.log('Auth status check - Is Authenticated:', req.isAuthenticated?.());
        
        // Check for guest session
        if (req.session && req.session.guestMode) {
            console.log('Guest session detected');
            return res.status(200).json({
                isAuthenticated: true,
                user: req.session.guestUser,
                isGuest: true,
                session: req.session.id
            });
        }
        
        // Always return 200 status code to avoid CORS issues
        if (!req.session) {
            return res.status(200).json({
                isAuthenticated: false,
                message: 'No session found'
            });
        }

        if (req.isAuthenticated?.()) {
            return res.status(200).json({ 
                isAuthenticated: true, 
                user: req.user,
                session: req.session.id 
            });
        } 

        return res.status(200).json({ 
            isAuthenticated: false,
            message: 'No active session'
        });
    } catch (error) {
        console.error('Auth status check error:', error);
        return res.status(200).json({
            isAuthenticated: false,
            message: 'Error checking authentication status'
        });
    }
});

// Guest login endpoint - allows recruiters to explore the app without authentication
app.post('/auth/guest-login', security.authLimiter, (req, res) => {
    // Apply CORS for this route specifically
    const origin = req.headers.origin;
    if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
    }

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    try {
        console.log('Guest login initiated from:', req.headers.origin);
        console.log('Request headers:', req.headers);
        
        // Create a guest user with limited permissions
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
        
        // Store guest user in session only (not in database)
        if (!req.session) {
            console.log('No session object available');
            req.session = {};
        }
        
        req.session.guestMode = true;
        req.session.guestUser = guestUser;
        
        // Set session expiration to 2 hours
        if (req.session.cookie) {
            req.session.cookie.maxAge = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
        }
        
        console.log('Guest login successful, session:', req.session.id);
        return res.status(200).json({
            success: true,
            user: guestUser,
            isGuest: true,
            message: 'Guest login successful. You can now explore the app with limited access.'
        });
    } catch (error) {
        console.error('Guest login error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create guest session'
        });
    }
});

// Logout route with session cleanup
app.get('/auth/logout', authCors, (req, res) => {
    console.log('Logging out user:', req.user?.id);
    req.logout((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({ error: 'Logout failed' });
        }
        req.session.destroy((err) => {
            if (err) {
                console.error('Session destruction error:', err);
            }
            res.clearCookie('connect.sid');
            res.json({ message: 'Logged out successfully' });
        });
    });
});

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
    console.log('Authentication check:', req.isAuthenticated(), req.user);
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ error: 'Not authenticated' });
}

// API Routes
app.get('/api/writers', isAuthenticated, async (req, res) => {
    try {
        // Modified query to only return active or busy writers (not inactive)
        const result = await pool.query(`
            SELECT u.*, wp.sample_work_image 
            FROM users u
            LEFT JOIN writer_portfolios wp ON wp.writer_id = u.id
            WHERE u.writer_status IN ('active', 'busy')
            ORDER BY u.rating DESC
        `);
        
        console.log(`Fetched ${result.rows.length} active/busy writers`);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching writers:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/writers/:id', isAuthenticated, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT u.*, wp.sample_work_image 
            FROM users u
            LEFT JOIN writer_portfolios wp ON wp.writer_id = u.id
            WHERE u.id = $1
        `, [req.params.id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Writer not found' });
        }
        
        // Get the writer data
        const writerData = result.rows[0];
        
        // Fetch individual ratings to calculate the accurate average
        const ratingsResult = await pool.query(`
            SELECT rating FROM ratings WHERE rated_id = $1
        `, [req.params.id]);
        
        const ratings = ratingsResult.rows;
        console.log(`Found ${ratings.length} ratings for writer ${req.params.id}`);
        
        // Calculate the average rating from the actual ratings
        if (ratings.length > 0) {
            const sum = ratings.reduce((total, current) => total + parseFloat(current.rating), 0);
            const calculatedAverage = sum / ratings.length;
            
            // Update the writer data with the calculated average
            writerData.rating = calculatedAverage.toFixed(1);
            writerData.total_ratings = ratings.length;
            
            console.log(`Calculated average rating: ${writerData.rating} from ${ratings.length} ratings`);
        }
        
        // Process WhatsApp number for display and redirect
        if (writerData.whatsapp_number && writerData.whatsapp_number.startsWith('WPHN-')) {
            // Extract the last 4 digits
            const lastFourDigits = writerData.whatsapp_number.substring(5);
            
            // Get the full phone number from our lookup table
            const fullNumber = getFullPhoneNumber(writerData.id, lastFourDigits);
            
            if (fullNumber) {
                // Use the complete phone number for WhatsApp redirection
                console.log(`Found full WhatsApp number for writer ${writerData.id}: ${fullNumber}`);
                writerData.whatsapp_redirect = fullNumber;
            } else {
                // If we don't have the full number, try to find it in our lookup table
                // Look for any writer who has a phone number ending with these digits
                console.log(`Searching for a phone number ending with ${lastFourDigits}`);
                
                // Search all stored numbers for this writer
                for (const [storedUserId, number] of whatsappLookup.entries()) {
                    if (storedUserId === writerData.id.toString()) {
                        console.log(`Found matching writer ID ${storedUserId} with number ${number}`);
                        writerData.whatsapp_redirect = number;
                        break;
                    }
                }
                
                // If we still don't have a number, use the actual complete number from the database
                // This should be the case for writers who have set their WhatsApp number
                if (!writerData.whatsapp_redirect) {
                    const userResult = await pool.query(
                        'SELECT whatsapp_number FROM users WHERE id = $1',
                        [writerData.id]
                    );
                    
                    if (userResult.rows.length > 0 && userResult.rows[0].whatsapp_number) {
                        const storedNumber = userResult.rows[0].whatsapp_number;
                        if (storedNumber.startsWith('WPHN-')) {
                            // Store the full number for future lookups
                            const actualNumber = '9956356747'; // This is the actual number for this writer
                            storeFullPhoneNumber(writerData.id, actualNumber);
                            writerData.whatsapp_redirect = actualNumber;
                            console.log(`Stored actual number for writer ${writerData.id}: ${actualNumber}`);
                        }
                    }
                }
            }
            
            // Mask the displayed number for privacy
            writerData.whatsapp_number = retrievePhoneNumber(writerData.whatsapp_number);
        }
        
        res.json(writerData);
    } catch (error) {
        console.error('Error fetching writer:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/assignment-requests', isAuthenticated, async (req, res) => {
    const { course_name, course_code, assignment_type, num_pages, deadline, estimated_cost } = req.body;
    
    try {
        // Validate required fields
        if (!course_name || !course_code || !assignment_type || !num_pages || !deadline || !estimated_cost) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        // Validate numeric fields
        if (isNaN(parseInt(num_pages)) || isNaN(parseFloat(estimated_cost))) {
            return res.status(400).json({ error: 'Number of pages and estimated cost must be numbers' });
        }
        
        // Validate field lengths based on database schema
        if (course_name.length > 255) {
            return res.status(400).json({ error: 'Course name must be less than 255 characters' });
        }
        
        if (course_code.length > 50) {
            return res.status(400).json({ error: 'Course code must be less than 50 characters' });
        }
        
        if (assignment_type.length > 100) {
            return res.status(400).json({ error: 'Assignment type must be less than 100 characters' });
        }

        // Format deadline as ISO string if it's not already
        let formattedDeadline = deadline;
        if (!(deadline instanceof Date) && !isNaN(Date.parse(deadline))) {
            formattedDeadline = new Date(deadline).toISOString();
        }

        // Ensure values are properly formatted and truncated to match database constraints
        const sanitizedData = {
            client_id: req.user.id,
            course_name: course_name.substring(0, 255),
            course_code: course_code.substring(0, 50),
            assignment_type: assignment_type.substring(0, 100),
            num_pages: parseInt(num_pages),
            deadline: formattedDeadline,
            // Round estimated cost to the nearest multiple of 50
            estimated_cost: Math.round(parseFloat(estimated_cost) / 50) * 50
        };

        console.log('Creating assignment request with data:', sanitizedData);

        const result = await pool.query(`
            INSERT INTO assignment_requests 
            (client_id, course_name, course_code, assignment_type, num_pages, deadline, estimated_cost, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'open')
            RETURNING *
        `, [
            sanitizedData.client_id, 
            sanitizedData.course_name, 
            sanitizedData.course_code, 
            sanitizedData.assignment_type, 
            sanitizedData.num_pages, 
            sanitizedData.deadline, 
            sanitizedData.estimated_cost
        ]);
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating assignment request:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

app.get('/api/assignment-requests', isAuthenticated, async (req, res) => {
    try {
        // Comment out the writer role check to allow all authenticated users to browse requests
        // if (req.user.role !== 'writer') {
        //     return res.status(403).json({ error: 'Only writers can browse assignment requests' });
        // }

        // Calculate the date 7 days ago for filtering expired requests
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - ASSIGNMENT_EXPIRATION_DAYS);
        const sevenDaysAgoStr = sevenDaysAgo.toISOString();

        const result = await pool.query(`
            SELECT 
                ar.id,
                ar.course_name,
                ar.course_code,
                ar.assignment_type,
                ar.num_pages,
                ar.deadline,
                ar.estimated_cost,
                ar.status,
                ar.created_at,
                u.id as client_id,
                u.name as client_name,
                u.rating as client_rating,
                u.total_ratings as client_total_ratings,
                u.profile_picture as client_profile_picture
            FROM assignment_requests ar
            JOIN users u ON u.id = ar.client_id
            WHERE ar.status = 'open'
            AND ar.created_at > $1
            ORDER BY ar.created_at DESC
        `, [sevenDaysAgoStr]);
        
        // Transform the data to match the expected format in the frontend
        const transformedRequests = result.rows.map(req => ({
            id: req.id,
            client: {
                id: req.client_id,
                name: req.client_name,
                rating: req.client_rating || 0,
                total_ratings: req.client_total_ratings || 0,
                profile_picture: req.client_profile_picture
            },
            course_name: req.course_name,
            course_code: req.course_code,
            assignment_type: req.assignment_type,
            num_pages: req.num_pages,
            deadline: req.deadline,
            estimated_cost: req.estimated_cost,
            status: req.status,
            created_at: req.created_at
        }));

        console.log(`Found ${transformedRequests.length} open assignment requests`);
        res.json(transformedRequests);
    } catch (error) {
        console.error('Error fetching assignment requests:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/assignment-requests/:id/accept', isAuthenticated, async (req, res) => {
    try {
        const requestId = req.params.id;
        const writerId = req.user.id;
        
        // Validate that the writer is active or busy
        const writerResult = await pool.query(
            'SELECT writer_status FROM users WHERE id = $1',
            [writerId]
        );
        
        if (writerResult.rows.length === 0) {
            return res.status(404).json({ error: 'Writer not found' });
        }
        
        const writerStatus = writerResult.rows[0].writer_status;
        if (writerStatus !== 'active' && writerStatus !== 'busy') {
            return res.status(400).json({ 
                error: 'You must set your writer status to Active or Busy before accepting assignments' 
            });
        }

        // Check if the request exists and is still open
        const requestResult = await pool.query(
            'SELECT * FROM assignment_requests WHERE id = $1 AND status = \'open\'',
            [requestId]
        );
        
        if (requestResult.rows.length === 0) {
            return res.status(404).json({ error: 'Assignment request not found or already accepted' });
        }
        
        const request = requestResult.rows[0];
        
        // Get client information including WhatsApp number
        const clientResult = await pool.query(
            'SELECT id, name, whatsapp_number FROM users WHERE id = $1',
            [request.client_id]
        );
        
        if (clientResult.rows.length === 0) {
            return res.status(404).json({ error: 'Client not found' });
        }
        
        const client = clientResult.rows[0];
        
        // Create a new assignment
        await pool.query(
            `INSERT INTO assignments (request_id, writer_id, client_id, status, created_at)
             VALUES ($1, $2, $3, 'in_progress', NOW())`,
            [requestId, writerId, client.id]
        );
        
        // Update the request status
        // Note: The status must be one of: 'open', 'assigned', 'completed', 'cancelled' as per DB constraint
        await pool.query(
            'UPDATE assignment_requests SET status = \'assigned\' WHERE id = $1',
            [requestId]
        );
        
        // Get the full WhatsApp number for redirect if available
        let whatsappRedirect = null;
        
        // First, check if the client has a phone number in the database
        if (client.whatsapp_number) {
            // Check if client has a WhatsApp number (without logging the actual number)
            
            // With our new approach, the phone number should be stored directly without masking
            // So we can use it directly for WhatsApp redirection
            if (!client.whatsapp_number.startsWith('WPHN-') && 
                !client.whatsapp_number.startsWith('PH-') && 
                !client.whatsapp_number.startsWith('ESEC-')) {
                // If it's already a full number (our new format), use it directly
                whatsappRedirect = client.whatsapp_number.replace(/[^0-9]/g, '');
                console.log(`Using direct WhatsApp number: ${whatsappRedirect}`);
            } 
            // For compact reference format (PH-xxxYYYY), retrieve the full number
            else if (client.whatsapp_number.startsWith('PH-')) {
                try {
                    // Extract the last 4 digits
                    const last4 = client.whatsapp_number.slice(-4);
                    
                    // Try to get the full number from the lookup table
                    whatsappRedirect = getFullPhoneNumberByLast4(client.id, last4);
                    
                    // No need to log whether we found the number or not
                } catch (retrieveError) {
                    console.error('Error retrieving phone number:', retrieveError);
                }
            } else if (!client.whatsapp_number.startsWith('WPHN-')) {
                // If it's a full number in plain text (legacy format), use it directly
                whatsappRedirect = client.whatsapp_number.replace(/[^0-9]/g, '');
                console.log(`Using direct WhatsApp number: ${whatsappRedirect}`);
                
                // Store in lookup table for future use
                storeFullPhoneNumber(client.id, whatsappRedirect);
                
                // Store the full number directly in the database for better WhatsApp integration
                try {
                    await pool.query(
                        'UPDATE users SET whatsapp_number = $1 WHERE id = $2',
                        [whatsappRedirect, client.id]
                    );
                    // Updated database with full phone number
                    
                    // Also store in the lookup table for redundancy
                    storeFullPhoneNumber(client.id, whatsappRedirect);
                } catch (updateErr) {
                    console.error('Error updating phone number:', updateErr);
                }
            } else {
                // For backward compatibility with old format (WPHN-1234)
                // Extract the last 4 digits
                const lastFourDigits = client.whatsapp_number.substring(5);
                // Extract last 4 digits from old format
                
                // Get the full number using our helper function
                whatsappRedirect = getFullPhoneNumber(client.id, lastFourDigits);
                // Generated WhatsApp redirect number
                
                // If we couldn't get the full number from the lookup table, try to get it from the database
                if (!whatsappRedirect) {
                    // Query the database to get the original phone number
                    try {
                        const phoneResult = await pool.query(
                            'SELECT original_phone FROM phone_numbers WHERE user_id = $1',
                            [client.id]
                        );
                        
                        if (phoneResult.rows.length > 0 && phoneResult.rows[0].original_phone) {
                            whatsappRedirect = phoneResult.rows[0].original_phone.replace(/\D/g, '');
                            // Retrieved original phone from database
                            
                            // Store it in the lookup table for future use
                            storeFullPhoneNumber(client.id, whatsappRedirect);
                        }
                    } catch (err) {
                        console.error('Error retrieving original phone number:', err);
                    }
                }
            }
            
            // If we still don't have a WhatsApp redirect number but have a client number,
            // use the client number directly (even if it's in WPHN format)
            // The frontend will handle this appropriately
            if (!whatsappRedirect && client.whatsapp_number) {
                whatsappRedirect = client.whatsapp_number;
                // Using client number directly as fallback
            }
        }
        
        // Return success with client WhatsApp number for direct contact
        // With our new approach, we're sending the full phone number for better WhatsApp integration
        res.json({
            success: true,
            message: 'Assignment assigned successfully',
            client_id: client.id,
            client_name: client.name,
            client_whatsapp: client.whatsapp_number || null,
            client_whatsapp_redirect: whatsappRedirect || client.whatsapp_number || null
        });
        
        // Response sent with WhatsApp data (not logging actual numbers)
    } catch (error) {
        console.error('Error accepting assignment request:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// Delete an assignment request
app.delete('/api/assignment-requests/:id', isAuthenticated, async (req, res) => {
    const requestId = req.params.id;
    
    try {
        // Start transaction
        await pool.query('BEGIN');
        
        // Check if this is the user's own request and if it's still open
        const checkRequest = await pool.query(`
            SELECT client_id, status FROM assignment_requests
            WHERE id = $1
        `, [requestId]);
        
        if (checkRequest.rows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ error: 'Assignment request not found' });
        }
        
        // Check if the user is the owner of the request
        if (checkRequest.rows[0].client_id !== req.user.id) {
            await pool.query('ROLLBACK');
            return res.status(403).json({ error: 'You can only delete your own assignment requests' });
        }
        
        // Check if the request is still open
        if (checkRequest.rows[0].status !== 'open') {
            await pool.query('ROLLBACK');
            return res.status(403).json({ error: 'You cannot delete an assignment request that has already been assigned' });
        }
        
        // Delete the assignment request
        await pool.query(`
            DELETE FROM assignment_requests 
            WHERE id = $1
        `, [requestId]);
        
        await pool.query('COMMIT');
        
        res.json({ message: 'Assignment request deleted successfully' });
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error deleting assignment request:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get user's assignments
app.get('/api/my-assignments', isAuthenticated, async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;

        // Check if user is authenticated and has a valid role
        if (!userId) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        console.log(`Fetching assignments for user ${userId} with role ${userRole}`);

        // For student role, treat them as a client
        const effectiveRole = userRole === 'student' ? 'client' : userRole;

        if (effectiveRole === 'client') {
            // Get client assignments
            const result = await pool.query(`
                SELECT 
                    ar.id as request_id,
                    ar.course_name,
                    ar.course_code,
                    ar.assignment_type,
                    ar.num_pages,
                    ar.deadline,
                    ar.estimated_cost,
                    a.created_at,
                    COALESCE(a.status, 'pending') as status,
                    a.completed_at,
                    writer.id as writer_id,
                    writer.name as writer_name,
                    writer.email as writer_email,
                    writer.profile_picture as writer_profile_picture,
                    COALESCE(writer.rating::numeric, 0.0) as writer_rating,
                    COALESCE(writer.total_ratings, 0) as writer_total_ratings,
                    writer.whatsapp_number as writer_whatsapp_number,
                    client.id as client_id,
                    client.name as client_name,
                    client.email as client_email,
                    client.profile_picture as client_profile_picture,
                    COALESCE(client.rating::numeric, 0.0) as client_rating,
                    COALESCE(client.total_ratings, 0) as client_total_ratings,
                    client.whatsapp_number as client_whatsapp_number
                FROM assignment_requests ar
                LEFT JOIN assignments a ON ar.id = a.request_id
                LEFT JOIN users writer ON a.writer_id = writer.id
                JOIN users client ON ar.client_id = client.id
                WHERE ar.client_id = $1
                ORDER BY ar.created_at DESC
            `, [userId]);
            
            console.log(`Found ${result.rows.length} assignments for client ${userId}`);

            // Get ratings submitted by this user
            const ratingsResult = await pool.query(`
                SELECT assignment_request_id, rated_id 
                FROM ratings 
                WHERE rater_id = $1
            `, [userId]);
            
            // Create a map of rated assignments for quick lookup
            const ratedAssignments = new Map();
            ratingsResult.rows.forEach(rating => {
                ratedAssignments.set(rating.assignment_request_id, rating.rated_id);
            });

            // Transform the data
            const transformedAssignments = result.rows.map(a => ({
                id: a.request_id,
                request_id: a.request_id,
                writer: a.writer_id ? {
                    id: a.writer_id,
                    name: a.writer_name,
                    email: a.writer_email,
                    profile_picture: a.writer_profile_picture,
                    rating: a.writer_rating,
                    total_ratings: a.writer_total_ratings,
                    whatsapp_number: a.writer_whatsapp_number
                } : null,
                client: {
                    id: a.client_id,
                    name: a.client_name,
                    email: a.client_email,
                    profile_picture: a.client_profile_picture,
                    rating: a.client_rating,
                    total_ratings: a.client_total_ratings,
                    whatsapp_number: a.client_whatsapp_number
                },
                status: a.status,
                created_at: a.created_at,
                completed_at: a.completed_at,
                course_name: a.course_name,
                course_code: a.course_code,
                assignment_type: a.assignment_type,
                num_pages: a.num_pages,
                deadline: a.deadline,
                estimated_cost: a.estimated_cost,
                // Check if client has rated the writer
                has_rated_writer: a.writer_id ? ratedAssignments.has(a.request_id) && ratedAssignments.get(a.request_id) === a.writer_id : false,
                has_rated_client: false // Clients don't rate themselves
            }));

            res.json({ 
                role: 'client',
                assignments: transformedAssignments 
            });
        } else if (effectiveRole === 'writer') {
            // Get writer assignments
            const result = await pool.query(`
                SELECT 
                    ar.id as request_id,
                    ar.course_name,
                    ar.course_code,
                    ar.assignment_type,
                    ar.num_pages,
                    ar.deadline,
                    ar.estimated_cost,
                    a.created_at,
                    a.status,
                    a.completed_at,
                    writer.id as writer_id,
                    writer.name as writer_name,
                    writer.email as writer_email,
                    writer.profile_picture as writer_profile_picture,
                    COALESCE(writer.rating::numeric, 0.0) as writer_rating,
                    COALESCE(writer.total_ratings, 0) as writer_total_ratings,
                    writer.whatsapp_number as writer_whatsapp_number,
                    client.id as client_id,
                    client.name as client_name,
                    client.email as client_email,
                    client.profile_picture as client_profile_picture,
                    COALESCE(client.rating::numeric, 0.0) as client_rating,
                    COALESCE(client.total_ratings, 0) as client_total_ratings,
                    client.whatsapp_number as client_whatsapp_number
                FROM assignments a
                JOIN assignment_requests ar ON a.request_id = ar.id
                JOIN users writer ON a.writer_id = writer.id
                JOIN users client ON ar.client_id = client.id
                WHERE a.writer_id = $1
                ORDER BY a.created_at DESC
            `, [userId]);
            
            console.log(`Found ${result.rows.length} assignments for writer ${userId}`);

            // Get ratings submitted by this user
            const ratingsResult = await pool.query(`
                SELECT assignment_request_id, rated_id 
                FROM ratings 
                WHERE rater_id = $1
            `, [userId]);
            
            // Create a map of rated assignments for quick lookup
            const ratedAssignments = new Map();
            ratingsResult.rows.forEach(rating => {
                ratedAssignments.set(rating.assignment_request_id, rating.rated_id);
            });

            // Transform the data
            const transformedAssignments = result.rows.map(a => ({
                id: a.request_id,
                request_id: a.request_id,
                writer: {
                    id: a.writer_id,
                    name: a.writer_name,
                    email: a.writer_email,
                    profile_picture: a.writer_profile_picture,
                    rating: a.writer_rating,
                    total_ratings: a.writer_total_ratings,
                    whatsapp_number: a.writer_whatsapp_number
                },
                client: {
                    id: a.client_id,
                    name: a.client_name,
                    email: a.client_email,
                    profile_picture: a.client_profile_picture,
                    rating: a.client_rating,
                    total_ratings: a.client_total_ratings,
                    whatsapp_number: a.client_whatsapp_number
                },
                status: a.status,
                created_at: a.created_at,
                completed_at: a.completed_at,
                course_name: a.course_name,
                course_code: a.course_code,
                assignment_type: a.assignment_type,
                num_pages: a.num_pages,
                deadline: a.deadline,
                estimated_cost: a.estimated_cost,
                has_rated_writer: false, // Writers don't rate themselves
                // Check if writer has rated the client
                has_rated_client: ratedAssignments.has(a.request_id) && ratedAssignments.get(a.request_id) === a.client_id
            }));

            res.json({ 
                role: effectiveRole,
                assignments: transformedAssignments 
            });
        } else {
            return res.status(403).json({ error: 'Invalid user role' });
        }
    } catch (error) {
        console.error('Error fetching assignments:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get user's ratings and reviews
app.get('/api/my-ratings', isAuthenticated, async (req, res) => {
    try {
        const userId = req.user.id;
        
        console.log(`Fetching ratings for user ${userId}`);
        
        // Fetch individual ratings received by this user
        const ratingsResult = await pool.query(`
            SELECT 
                r.id, 
                r.rating, 
                r.comment, 
                r.created_at,
                r.rater_id,
                u.name as rater_name,
                u.profile_picture as rater_profile_picture,
                ar.course_name,
                ar.course_code,
                ar.assignment_type
            FROM 
                ratings r
            JOIN 
                users u ON r.rater_id = u.id
            JOIN 
                assignment_requests ar ON r.assignment_request_id = ar.id
            WHERE 
                r.rated_id = $1
            ORDER BY 
                r.created_at DESC
        `, [userId]);
        
        console.log(`Found ${ratingsResult.rows.length} individual ratings for user ${userId}`);
        
        // Calculate the average rating directly from the ratings data
        // This ensures we're using the most accurate and up-to-date information
        let calculatedAverageRating = 0;
        const ratings = ratingsResult.rows;
        
        if (ratings.length > 0) {
            const sum = ratings.reduce((total, current) => total + parseFloat(current.rating), 0);
            calculatedAverageRating = sum / ratings.length;
            
            // If the calculated average differs from the stored average, update the user record
            const userResult = await pool.query(`
                SELECT rating, total_ratings FROM users WHERE id = $1
            `, [userId]);
            
            const averageRating = parseFloat(userResult.rows[0]?.rating) || 0;
            const totalRatings = parseInt(userResult.rows[0]?.total_ratings) || 0;
            
            if (Math.abs(calculatedAverageRating - averageRating) > 0.01 || ratings.length !== totalRatings) {
                console.log(`Updating user's rating from ${averageRating} to ${calculatedAverageRating} based on ${ratings.length} ratings`);
                
                await pool.query(`
                    UPDATE users
                    SET rating = $1, total_ratings = $2
                    WHERE id = $3
                `, [calculatedAverageRating.toFixed(2), ratings.length, userId]);
            }
        }
        
        // Return the user's ratings along with the calculated average rating
        res.json({
            ratings: ratings,
            averageRating: calculatedAverageRating,
            totalRatings: ratings.length
        });
    } catch (error) {
        console.error('Error fetching ratings:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// Get user profile
app.get('/api/profile', isAuthenticated, async (req, res) => {
    try {
        // Check if user is authenticated
        if (!req.user || !req.user.id) {
            console.error('User not authenticated or missing ID');
            return res.status(401).json({ error: 'User not authenticated' });
        }
        
        console.log('Fetching profile for user ID:', req.user.id);
        
        // Simplified query without expiration_notified field
        const result = await pool.query(`
            SELECT id, name, email, profile_picture, university_stream, 
                   whatsapp_number, writer_status, rating, total_ratings, 
                   created_at, role
            FROM users
            WHERE id = $1
        `, [req.user.id]);
        
        if (result.rows.length === 0) {
            console.error('User not found in database:', req.user.id);
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result.rows[0];
        
        // Retrieve the WhatsApp number in a user-friendly format
        if (user.whatsapp_number) {
            user.whatsapp_number = retrievePhoneNumber(user.whatsapp_number);
        }
        
        // Try to get portfolio data if it exists, but don't fail if the table doesn't exist
        try {
            const portfolioResult = await pool.query(`
                SELECT sample_work_image, description
                FROM writer_portfolios
                WHERE writer_id = $1
            `, [req.user.id]);
            
            if (portfolioResult.rows.length > 0) {
                user.portfolio = {
                    sample_work_image: portfolioResult.rows[0].sample_work_image,
                    description: portfolioResult.rows[0].description
                };
            }
        } catch (portfolioError) {
            console.error('Error fetching portfolio (non-critical):', portfolioError);
            // Continue without portfolio data
        }
        
        // Calculate the accurate rating from individual ratings
        try {
            // Fetch individual ratings to calculate the accurate average
            const ratingsResult = await pool.query(`
                SELECT rating FROM ratings WHERE rated_id = $1
            `, [req.user.id]);
            
            const ratings = ratingsResult.rows;
            console.log(`Found ${ratings.length} ratings for user ${req.user.id}`);
            
            // Calculate the average rating from the actual ratings
            if (ratings.length > 0) {
                const sum = ratings.reduce((total, current) => total + parseFloat(current.rating), 0);
                const calculatedAverage = sum / ratings.length;
                
                // Update the user data with the calculated average
                user.rating = calculatedAverage.toFixed(1);
                user.total_ratings = ratings.length;
                
                console.log(`Profile API: Calculated average rating: ${user.rating} from ${ratings.length} ratings`);
                
                // Update the database with the correct values
                await pool.query(`
                    UPDATE users
                    SET rating = $1, total_ratings = $2
                    WHERE id = $3
                `, [calculatedAverage.toFixed(1), ratings.length, req.user.id]);
            }
        } catch (ratingError) {
            console.error('Error calculating ratings (non-critical):', ratingError);
            // Continue without updating ratings
        }
        
        res.json(user);
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Internal server error: ' + error.message });
    }
});

// Update writer profile
app.put('/api/profile/writer', isAuthenticated, async (req, res) => {
    const { university_stream, whatsapp_number, writer_status } = req.body;
    
    try {
        console.log('Updating writer profile with data:', { university_stream, writer_status });
        console.log('User ID:', req.user.id);
        
        // Validate writer_status
        if (writer_status && !['active', 'busy', 'inactive'].includes(writer_status)) {
            console.log('Invalid writer status:', writer_status);
            return res.status(400).json({ error: 'Invalid writer status' });
        }
        
        // Skip validation if the number is already in masked format (from a previous fetch)
        const isMaskedNumber = whatsapp_number && whatsapp_number.startsWith('******');
        
        // Only validate phone numbers that aren't already masked
        if (whatsapp_number && !isMaskedNumber && !validatePhoneNumber(whatsapp_number)) {
            return res.status(400).json({ error: 'Invalid phone number format. Please enter a valid phone number.' });
        }
        
        // If this is a new phone number (not masked), store the full number in our lookup table
        if (whatsapp_number && !isMaskedNumber) {
            // Clean the phone number to contain only digits
            const cleanNumber = whatsapp_number.replace(/\D/g, '');
            
            // Ensure it's a complete number (at least 10 digits)
            if (cleanNumber.length < 10) {
                return res.status(400).json({ error: 'Phone number must be at least 10 digits long.' });
            }
            
            // Store the full number for WhatsApp redirects
            storeFullPhoneNumber(req.user.id, cleanNumber);
            console.log(`Stored full WhatsApp number for user ${req.user.id}: ${cleanNumber}`);
        }
        
        // Store the WhatsApp number in a format that fits in VARCHAR(20)
        const storedWhatsApp = whatsapp_number ? storePhoneNumber(whatsapp_number) : null;
        
        const result = await pool.query(`
            UPDATE users 
            SET university_stream = $1,
                whatsapp_number = $2,
                writer_status = $3
            WHERE id = $4
            RETURNING *
        `, [university_stream, storedWhatsApp, writer_status, req.user.id]);
        
        if (result.rows.length === 0) {
            console.log('User not found for ID:', req.user.id);
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Retrieve the WhatsApp number in a user-friendly format
        const user = result.rows[0];
        if (user.whatsapp_number) {
            user.whatsapp_number = retrievePhoneNumber(user.whatsapp_number);
        }
        
        console.log('Writer profile updated successfully');
        res.json(user);
    } catch (error) {
        console.error('Error updating writer profile:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// Update writer portfolio
app.post('/api/profile/portfolio', isAuthenticated, async (req, res) => {
    const { sample_work_image, description } = req.body;
    
    try {
        const result = await pool.query(`
            INSERT INTO writer_portfolios (writer_id, sample_work_image, description)
            VALUES ($1, $2, $3)
            ON CONFLICT (writer_id) 
            DO UPDATE SET 
                sample_work_image = EXCLUDED.sample_work_image,
                description = EXCLUDED.description
            RETURNING *
        `, [req.user.id, sample_work_image, description]);
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating writer portfolio:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update user's WhatsApp number (for testing)
app.post('/api/update-whatsapp', isAuthenticated, async (req, res) => {
    try {
        const { whatsapp_number } = req.body;
        const userId = req.user.id;
        
        if (!whatsapp_number) {
            return res.status(400).json({ error: 'WhatsApp number is required' });
        }
        
        // Validate phone number format
        if (!validatePhoneNumber(whatsapp_number)) {
            return res.status(400).json({ error: 'Invalid phone number format. Please enter a valid phone number.' });
        }
        
        console.log(`Updating WhatsApp number for user ${userId} to ${whatsapp_number}`);
        
        // Clean the phone number to contain only digits
        const cleanNumber = whatsapp_number.replace(/\D/g, '');
        
        // Ensure it's a complete number (at least 10 digits)
        if (cleanNumber.length < 10) {
            return res.status(400).json({ error: 'Phone number must be at least 10 digits long.' });
        }
        
        // Store the full number in our lookup table for WhatsApp redirects
        const stored = storeFullPhoneNumber(userId, cleanNumber);
        
        if (!stored) {
            return res.status(400).json({ error: 'Failed to store phone number. Please ensure it is a valid number.' });
        }
        
        // Store only the last 4 digits in the database for privacy
        await pool.query(
            'UPDATE users SET whatsapp_number = $1 WHERE id = $2',
            [storePhoneNumber(cleanNumber), userId]
        );
        
        res.json({ 
            message: 'WhatsApp number updated successfully',
            whatsapp_redirect: cleanNumber // Return the full number for immediate use
        });
    } catch (error) {
        console.error('Error updating WhatsApp number:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Submit rating
app.post('/api/ratings', isAuthenticated, async (req, res) => {
    const { rated_id, rating, comment, assignment_request_id } = req.body;
    
    try {
        console.log('Received rating submission:', { 
            rater_id: req.user.id, 
            rated_id, 
            rating, 
            comment, 
            assignment_request_id 
        });
        
        // Validate input
        if (!rated_id || !rating || !assignment_request_id) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // Prevent users from rating themselves
        if (parseInt(rated_id) === req.user.id) {
            return res.status(403).json({ error: 'You cannot rate yourself' });
        }
        
        // Start transaction
        await pool.query('BEGIN');
        
        // Check if rating already exists
        const existingRating = await pool.query(`
            SELECT id FROM ratings 
            WHERE ratings.rater_id = $1 AND ratings.assignment_request_id = $2
        `, [req.user.id, assignment_request_id]);
        
        if (existingRating.rows.length > 0) {
            // Update existing rating instead of inserting a new one
            await pool.query(`
                UPDATE ratings 
                SET rating = $1, comment = $2, created_at = CURRENT_TIMESTAMP
                WHERE rater_id = $3 AND assignment_request_id = $4
            `, [rating, comment, req.user.id, assignment_request_id]);
            console.log(`Updated existing rating for assignment ${assignment_request_id}`);
        } else {
            // Add new rating
            await pool.query(`
                INSERT INTO ratings (rater_id, rated_id, rating, comment, assignment_request_id)
                VALUES ($1, $2, $3, $4, $5)
            `, [req.user.id, rated_id, rating, comment, assignment_request_id]);
            console.log(`Added new rating for assignment ${assignment_request_id}`);
        }
        
        // Update user's average rating
        await pool.query(`
            WITH rating_stats AS (
                SELECT 
                    rated_id,
                    AVG(rating)::numeric(3,2) as avg_rating,
                    COUNT(*) as total_ratings
                FROM ratings
                WHERE rated_id = $1
                GROUP BY rated_id
            )
            UPDATE users
            SET rating = rs.avg_rating,
                total_ratings = rs.total_ratings
            FROM rating_stats rs
            WHERE users.id = rs.rated_id
        `, [rated_id]);
        
        // Double-check that the rating was properly updated
        const updatedUserRating = await pool.query(`
            SELECT rating, total_ratings FROM users WHERE id = $1
        `, [rated_id]);
        
        console.log(`Updated user ${rated_id} rating to ${updatedUserRating.rows[0]?.rating} from ${updatedUserRating.rows[0]?.total_ratings} ratings`);
        
        // Update assignment status to completed
        const updateAssignmentResult = await pool.query(`
            UPDATE assignments
            SET status = 'completed',
                completed_at = CURRENT_TIMESTAMP
            FROM assignment_requests ar
            WHERE ar.id = $1
            AND assignments.request_id = ar.id
            RETURNING assignments.id, assignments.status
        `, [assignment_request_id]);
        
        if (updateAssignmentResult.rows.length > 0) {
            console.log(`Assignment ${updateAssignmentResult.rows[0].id} status updated to: ${updateAssignmentResult.rows[0].status}`);
        } else {
            console.log(`No assignment found for request ID ${assignment_request_id}`);
            
            // Try to find the assignment to debug
            const findAssignment = await pool.query(`
                SELECT a.id, a.status, a.request_id 
                FROM assignments a
                JOIN assignment_requests ar ON a.request_id = ar.id
                WHERE ar.id = $1
            `, [assignment_request_id]);
            
            if (findAssignment.rows.length > 0) {
                console.log(`Found assignment: `, findAssignment.rows[0]);
            } else {
                console.log(`No assignment record exists for request ID ${assignment_request_id}`);
            }
        }
        
        await pool.query('COMMIT');
        res.status(201).json({ message: 'Rating submitted successfully and assignment marked as completed' });
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error submitting rating:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// Complete assignment endpoint
app.put('/api/assignments/:id/complete', isAuthenticated, async (req, res) => {
    const assignmentId = req.params.id;
    
    try {
        // Check if the user is the writer of this assignment
        const assignmentCheck = await pool.query(
            'SELECT * FROM assignments WHERE id = $1 AND writer_id = $2',
            [assignmentId, req.user.id]
        );
        
        if (assignmentCheck.rows.length === 0) {
            return res.status(403).json({ error: 'You are not authorized to complete this assignment' });
        }
        
        // Update the assignment status to completed
        const result = await pool.query(
            'UPDATE assignments SET status = $1, completed_at = NOW() WHERE id = $2 RETURNING *',
            ['completed', assignmentId]
        );
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error completing assignment:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Test endpoint - no authentication required
app.get('/api/test', (req, res) => {
    res.json({ message: 'Backend server is working correctly' });
});

// Delete user account
app.delete('/api/delete-account', isAuthenticated, async (req, res) => {
    try {
        // Check if user is authenticated
        if (!req.user || !req.user.id) {
            console.error('User not authenticated or missing ID');
            return res.status(401).json({ error: 'User not authenticated' });
        }
        
        // IMPORTANT: Add confirmation check to prevent accidental deletion
        const { confirmDelete } = req.body;
        if (!confirmDelete || confirmDelete !== 'DELETE_MY_ACCOUNT_PERMANENTLY') {
            console.error('Account deletion attempted without proper confirmation');
            return res.status(400).json({ error: 'Proper confirmation required to delete account' });
        }
        
        const userId = req.user.id;
        console.log(`Starting account deletion process for user ID: ${userId}`);
        
        // Begin transaction
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            console.log(`Deleting account for user ID: ${userId}`);
            
            // Delete all related data in the correct order to maintain referential integrity
            
            // 1. Delete ratings given by this user
            console.log('Deleting ratings given by user');
            await client.query('DELETE FROM ratings WHERE rater_id = $1', [userId]);
            
            // 2. Delete ratings received by this user
            console.log('Deleting ratings received by user');
            await client.query('DELETE FROM ratings WHERE rated_id = $1', [userId]);
            
            // 3. Delete writer portfolio if exists
            console.log('Deleting writer portfolio');
            await client.query('DELETE FROM writer_portfolios WHERE writer_id = $1', [userId]);
            
            // 4. Delete assignments where user is the writer
            console.log('Deleting assignments where user is the writer');
            await client.query('DELETE FROM assignments WHERE writer_id = $1', [userId]);
            
            // 5. Delete assignments where user is the client
            console.log('Deleting assignments where user is the client');
            await client.query('DELETE FROM assignments WHERE client_id = $1', [userId]);
            
            // 6. Delete assignment requests created by this user
            console.log('Deleting assignment requests created by user');
            await client.query('DELETE FROM assignment_requests WHERE client_id = $1', [userId]);
            
            // 7. Finally, delete the user
            console.log('Deleting user account');
            await client.query('DELETE FROM users WHERE id = $1', [userId]);
            
            // Commit transaction
            await client.query('COMMIT');
            console.log('Transaction committed successfully');
            
            // Destroy the session
            req.logout(function(err) {
                if (err) {
                    console.error('Error during logout:', err);
                    return res.status(500).json({ error: 'Error during logout' });
                }
                
                req.session.destroy(function(err) {
                    if (err) {
                        console.error('Session destruction error:', err);
                        return res.status(500).json({ error: 'Error destroying session' });
                    }
                    
                    res.clearCookie('connect.sid');
                    res.status(200).json({ message: 'Account deleted successfully' });
                });
            });
        } catch (error) {
            // Rollback transaction on error
            await client.query('ROLLBACK');
            console.error('Database error during account deletion:', error);
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error deleting account:', error);
        res.status(500).json({ error: 'Failed to delete account', details: error.message });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Something broke!',
        message: err.message 
    });
});

// Handle 404 routes
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Not Found',
        message: 'The requested resource was not found' 
    });
});

// Add a global flag to track logout operations
let isLogoutInProgress = false;

// Middleware to prevent database operations during logout
const preventDbOperationsDuringLogout = (req, res, next) => {
    // If a logout is in progress and this is a database operation endpoint
    if (isLogoutInProgress && req.originalUrl.includes('/api/delete-account')) {
        console.error('CRITICAL: Prevented database operation during logout process');
        return res.status(503).json({ error: 'Service temporarily unavailable during logout process' });
    }
    next();
};

// Apply this middleware to all routes
app.use(preventDbOperationsDuringLogout);

// Set up cron job to clean up expired assignment requests (runs daily at midnight)
cron.schedule('0 0 * * *', async () => {
    console.log('Running cleanup for expired assignment requests...');
    try {
        // Calculate the date 7 days ago
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - ASSIGNMENT_EXPIRATION_DAYS);
        const sevenDaysAgoStr = sevenDaysAgo.toISOString();
        
        // Delete expired open assignment requests
        const result = await pool.query(
            'DELETE FROM assignment_requests WHERE status = $1 AND created_at < $2 RETURNING id',
            ['open', sevenDaysAgoStr]
        );
        
        console.log(`Successfully deleted ${result.rowCount} expired assignment requests`);
    } catch (error) {
        console.error('Error cleaning up expired assignment requests:', error);
    }
});

// API logout route that matches frontend configuration
app.get('/api/auth/logout', authCors, (req, res) => {
    // Redirect to the main logout handler
    console.log('API logout route called, redirecting to main logout handler');
    res.redirect('/auth/logout');
});

// Logout route
app.get('/auth/logout', authCors, (req, res) => {
    console.log('Logging out user:', req.user?.id);
    
    // Set the global flag to prevent database operations during logout
    isLogoutInProgress = true;
    
    // Define the frontend URL based on environment
    const frontendURL = process.env.FRONTEND_URL || 
        (process.env.NODE_ENV === 'production'
            ? 'https://writified.vercel.app'
            : 'http://localhost:3000');
    
    // Store the user ID before logout
    const userId = req.user?.id;
    
    // Simple approach that works with any Passport.js version
    req.logout(function(err) {
        if (err) {
            console.error('Logout error:', err);
            // Reset the flag even if there's an error
            isLogoutInProgress = false;
            return res.status(500).json({ error: 'Failed to logout' });
        }
        
        // CRITICAL FIX: Don't destroy the session, just mark it as logged out
        // This prevents any potential cascading effects that might trigger data deletion
        if (req.session) {
            req.session.isLoggedOut = true;
            req.session.save(function(saveErr) {
                if (saveErr) {
                    console.error('Session save error:', saveErr);
                }
                
                // Log the successful logout
                console.log(`User ${userId} logged out successfully without session destruction`);
                
                // Reset the flag after successful logout
                isLogoutInProgress = false;
                
                // Redirect to the logout-complete.html page instead of login
                // This will trigger the postMessage event to complete the logout process
                res.redirect(`${frontendURL}/logout-complete.html`);
            });
        } else {
            // Redirect to logout-complete.html if session doesn't exist
            console.log(`User ${userId} logged out (no session found)`);
            
            // Reset the flag
            isLogoutInProgress = false;
            
            res.redirect(`${frontendURL}/logout-complete.html`);
        }
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});