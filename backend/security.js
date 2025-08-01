/**
 * Security utilities for the Writify application
 * Implements rate limiting, input validation, and protection against common attacks
 */
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const validator = require('validator');

// Failed login tracking for account lockout
const loginAttempts = new Map();

// Rate limiting middleware to prevent abuse
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
    // The rate-limiter should use the IP address provided by Express
    trustProxy: false
});

// More strict rate limiting for authentication routes, relaxed to handle Render cold starts
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Allow a burst of 20 requests to accommodate for cold starts
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many login attempts from this IP, please try again after 15 minutes',
    // The rate-limiter should use the IP address provided by Express
    trustProxy: false
});

// Function to check if account is locked
const isAccountLocked = (email) => {
    if (!loginAttempts.has(email)) return false;
    
    const attempts = loginAttempts.get(email);
    // Lock account after 5 failed attempts for 30 minutes
    if (attempts.count >= 5) {
        const lockTime = 30 * 60 * 1000; // 30 minutes
        const timeSinceLock = Date.now() - attempts.timestamp;
        if (timeSinceLock < lockTime) {
            return true;
        } else {
            // Reset after lock period
            loginAttempts.delete(email);
            return false;
        }
    }
    return false;
};

// Function to record failed login attempt
const recordFailedLogin = (email) => {
    if (!loginAttempts.has(email)) {
        loginAttempts.set(email, { count: 1, timestamp: Date.now() });
    } else {
        const attempts = loginAttempts.get(email);
        attempts.count += 1;
        attempts.timestamp = Date.now();
        loginAttempts.set(email, attempts);
    }
};

// Function to reset login attempts on successful login
const resetLoginAttempts = (email) => {
    loginAttempts.delete(email);
};

// Periodically clean up old login attempts (every hour)
setInterval(() => {
    const now = Date.now();
    const lockTime = 30 * 60 * 1000; // 30 minutes
    
    for (const [email, attempts] of loginAttempts.entries()) {
        if (now - attempts.timestamp > lockTime) {
            loginAttempts.delete(email);
        }
    }
}, 60 * 60 * 1000); // Clean up every hour

// Input validation middleware
const validateInput = (req, res, next) => {
    const sanitizedBody = {};
    const sanitizedParams = {};
    const sanitizedQuery = {};
    
    // Sanitize request body
    if (req.body) {
        Object.keys(req.body).forEach(key => {
            if (typeof req.body[key] === 'string') {
                // Sanitize strings to prevent XSS
                sanitizedBody[key] = validator.escape(req.body[key]);
            } else {
                sanitizedBody[key] = req.body[key];
            }
        });
        req.sanitizedBody = sanitizedBody;
    }
    
    // Sanitize URL parameters
    if (req.params) {
        Object.keys(req.params).forEach(key => {
            if (typeof req.params[key] === 'string') {
                sanitizedParams[key] = validator.escape(req.params[key]);
            } else {
                sanitizedParams[key] = req.params[key];
            }
        });
        req.sanitizedParams = sanitizedParams;
    }
    
    // Sanitize query parameters
    if (req.query) {
        Object.keys(req.query).forEach(key => {
            if (typeof req.query[key] === 'string') {
                sanitizedQuery[key] = validator.escape(req.query[key]);
            } else {
                sanitizedQuery[key] = req.query[key];
            }
        });
        req.sanitizedQuery = sanitizedQuery;
    }
    
    next();
};


// Configure security headers with helmet
const configureHelmet = (app) => {
    app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'", "https://accounts.google.com"],
                styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                fontSrc: ["'self'", "https://fonts.gstatic.com"],
                imgSrc: ["'self'", "data:", "https://lh3.googleusercontent.com", "https://media-hosting.imagekit.io"],
                connectSrc: ["'self'", "https://writifyapp.onrender.com"],
                frameSrc: ["'self'", "https://accounts.google.com"],
                objectSrc: ["'none'"],
                upgradeInsecureRequests: [],
            },
        },
        crossOriginEmbedderPolicy: false, // Allow embedding of cross-origin resources
        crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }, // Allow popups for OAuth
        crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin resource sharing
    }));
};

module.exports = {
    apiLimiter,
    authLimiter,
    isAccountLocked,
    recordFailedLogin,
    resetLoginAttempts,
    validateInput,
    configureHelmet
};
