const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
require('dotenv').config();
const cron = require('node-cron');
const { setupDatabase } = require('./db/setupDatabase');
const crypto = require('crypto');

// Encryption utilities for sensitive data
// Use environment variable for encryption key with a fallback
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-secret-encryption-key-min-32-chars'; // Must be 256 bits (32 characters)
const IV_LENGTH = 16; // For AES, this is always 16

// Encrypt sensitive data like phone numbers
function encrypt(text) {
    if (!text) return text;
    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    } catch (error) {
        console.error('Encryption error:', error);
        return text; // Return original text if encryption fails
    }
}

// Decrypt sensitive data
function decrypt(text) {
    if (!text || !text.includes(':')) return text;
    try {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (error) {
        console.error('Decryption error:', error);
        return text; // Return original text if decryption fails
    }
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
// This will only create tables if they don't exist
if (process.env.NODE_ENV === 'production' || process.env.INIT_DB === 'true') {
    console.log('Checking database setup...');
    setupDatabase(pool)
        .then(() => console.log('Database check complete'))
        .catch(err => console.error('Database check failed:', err));
}

const app = express();

// Create a proxy around the database pool to prevent DELETE operations during logout
const originalQuery = pool.query;
pool.query = function(text, params) {
    // Check if this is a DELETE operation and logout is in progress
    if (isLogoutInProgress && text.toUpperCase().includes('DELETE FROM')) {
        console.error('CRITICAL PROTECTION: Blocked DELETE operation during logout process');
        console.error('Attempted query:', text);
        
        // Return a mock result instead of executing the query
        return Promise.resolve({
            rows: [],
            rowCount: 0,
            command: 'SELECT', // Pretend it was a SELECT
            oid: null,
            fields: []
        });
    }
    
    // Otherwise, proceed with the original query
    return originalQuery.apply(this, arguments);
};

// Function to clean up old user data (older than 6 months)
// DISABLED: This function was deleting user data unexpectedly
const cleanupOldUserData = async () => {
    console.log('Data cleanup function is currently disabled to prevent data loss');
    return;
    
    // Original implementation below - currently disabled
    /*
    const client = await pool.connect();
    try {
        console.log('Running scheduled cleanup of old user data...');
        
        // Calculate date 6 months ago
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        // Begin transaction
        await client.query('BEGIN');
        
        // Get users to delete (created more than 6 months ago)
        const usersToDelete = await client.query(
            'SELECT id FROM users WHERE created_at < $1 AND role = $2',
            [sixMonthsAgo.toISOString(), 'student']
        );
        
        const userIds = usersToDelete.rows.map(row => row.id);
        console.log(`Found ${userIds.length} users to delete`);
        
        if (userIds.length > 0) {
            // Delete related data in proper order to maintain referential integrity
            // 1. Delete ratings given by or received by these users
            await client.query(
                'DELETE FROM ratings WHERE rater_id = ANY($1) OR rated_id = ANY($1)',
                [userIds]
            );
            
            // 2. Delete writer portfolios
            await client.query(
                'DELETE FROM writer_portfolios WHERE writer_id = ANY($1)',
                [userIds]
            );
            
            // 3. Delete assignments (first get assignment IDs)
            const assignmentsToDelete = await client.query(
                'SELECT id FROM assignments WHERE writer_id = ANY($1) OR client_id = ANY($1)',
                [userIds]
            );
            
            const assignmentIds = assignmentsToDelete.rows.map(row => row.id);
            
            // 4. Delete assignment requests
            await client.query(
                'DELETE FROM assignment_requests WHERE client_id = ANY($1) OR id IN (SELECT request_id FROM assignments WHERE writer_id = ANY($1))',
                [userIds, userIds]
            );
            
            // 5. Delete assignments
            await client.query(
                'DELETE FROM assignments WHERE writer_id = ANY($1) OR client_id = ANY($1)',
                [userIds]
            );
            
            // 6. Finally delete the users
            const deletedUsers = await client.query(
                'DELETE FROM users WHERE id = ANY($1) RETURNING email',
                [userIds]
            );
            
            console.log(`Successfully deleted ${deletedUsers.rowCount} users and their data`);
            console.log('Deleted user emails:', deletedUsers.rows.map(row => row.email));
        }
        
        // Commit transaction
        await client.query('COMMIT');
        console.log('Cleanup completed successfully');
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error during user data cleanup:', error);
    } finally {
        client.release();
    }
    */
};

// DISABLED: Schedule cleanup to run at midnight every day
// This will check for users older than 6 months and delete their data
// cron.schedule('0 0 * * *', cleanupOldUserData);

// DISABLED: Run cleanup on startup in production (optional)
/*
if (process.env.NODE_ENV === 'production') {
    // Wait 5 minutes after startup before running initial cleanup
    setTimeout(() => {
        cleanupOldUserData();
    }, 5 * 60 * 1000);
}
*/

// Define allowed origins based on environment
const allowedOrigins = process.env.FRONTEND_URL 
    ? [process.env.FRONTEND_URL, 'https://writify-app-huxg.vercel.app', 'https://writify-nrgkhzjtb-abrar-husains-projects.vercel.app', 'http://localhost:3000']
    : ['https://writify-app-huxg.vercel.app', 'https://writify-nrgkhzjtb-abrar-husains-projects.vercel.app', 'http://localhost:3000'];

// Middleware setup
app.use(cors({
    origin: function(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.log('Blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['set-cookie']
}));

app.use(express.json());

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
        secure: true,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'none',
        path: '/'
    }
};

// Configure session based on environment
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

app.use(session(sessionConfig));

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
        
        if (!isValidUniversityEmail(email)) {
            console.log('Email validation failed');
            return done(null, false, { message: 'Only university students with .student.iul.ac.in email can sign up!' });
        }

        // Check if user exists in database
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
    
    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Credentials', 'true');
    }
    
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
    
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    
    next();
};

// Auth routes with better error handling
app.get('/auth/google', authCors, (req, res, next) => {
    console.log('Starting Google OAuth flow');
    passport.authenticate('google', { 
        scope: ['profile', 'email'],
        prompt: 'select_account'
    })(req, res, next);
});

app.get('/auth/google/callback', authCors,
    passport.authenticate('google', { 
        failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=auth`,
        failureMessage: true,
        session: true
    }),
    (req, res) => {
        console.log('Google OAuth callback successful');
        res.redirect(process.env.FRONTEND_URL || 'http://localhost:3000');
    }
);

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

// Auth status endpoint with detailed logging
app.get('/auth/status', authCors, (req, res) => {
    console.log('Auth status check - Session:', req.session);
    console.log('Auth status check - User:', req.user);
    console.log('Auth status check - Is Authenticated:', req.isAuthenticated());
    
    if (req.isAuthenticated()) {
        res.json({ 
            isAuthenticated: true, 
            user: req.user,
            session: req.session.id 
        });
    } else {
        res.json({ 
            isAuthenticated: false,
            message: 'No active session'
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
        const result = await pool.query(`
            SELECT u.*, wp.sample_work_image 
            FROM users u
            LEFT JOIN writer_portfolios wp ON wp.writer_id = u.id
            WHERE u.writer_status IS NOT NULL
            ORDER BY u.rating DESC
        `);
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
        
        res.json(result.rows[0]);
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
            ORDER BY ar.created_at DESC
        `);
        
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
    const requestId = req.params.id;
    
    try {
        // Start transaction
        await pool.query('BEGIN');
        
        // First, check if this is the user's own request
        const checkOwnRequest = await pool.query(`
            SELECT client_id FROM assignment_requests
            WHERE id = $1
        `, [requestId]);
        
        if (checkOwnRequest.rows.length > 0 && checkOwnRequest.rows[0].client_id === req.user.id) {
            await pool.query('ROLLBACK');
            return res.status(403).json({ error: 'You cannot accept your own assignment request' });
        }
        
        // Update request status
        const requestResult = await pool.query(`
            UPDATE assignment_requests 
            SET status = 'assigned'
            WHERE id = $1 AND status = 'open'
            RETURNING *
        `, [requestId]);
        
        if (requestResult.rows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ error: 'Request not found or already assigned' });
        }
        
        // Create assignment
        await pool.query(`
            INSERT INTO assignments (request_id, writer_id, client_id, status)
            VALUES ($1, $2, $3, 'in_progress')
        `, [requestId, req.user.id, requestResult.rows[0].client_id]);
        
        // Update writer status
        await pool.query(`
            UPDATE users 
            SET writer_status = 'busy'
            WHERE id = $1
        `, [req.user.id]);
        
        await pool.query('COMMIT');
        
        // Get client's WhatsApp number
        const clientResult = await pool.query(`
            SELECT whatsapp_number 
            FROM users 
            WHERE id = $1
        `, [requestResult.rows[0].client_id]);
        
        res.json({
            ...requestResult.rows[0],
            client_whatsapp: clientResult.rows[0].whatsapp_number
        });
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('Error accepting assignment request:', error);
        res.status(500).json({ error: 'Server error' });
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
        
        // Get the user's current average rating
        const userResult = await pool.query(`
            SELECT rating, total_ratings FROM users WHERE id = $1
        `, [userId]);
        
        const averageRating = parseFloat(userResult.rows[0]?.rating) || 0;
        const totalRatings = parseInt(userResult.rows[0]?.total_ratings) || 0;
        
        console.log(`User ${userId} has average rating ${averageRating} from ${totalRatings} ratings`);
        
        // Return just the user's average rating for now
        // This simplified endpoint should work even if the detailed ratings query fails
        res.json({
            ratings: [],
            averageRating,
            totalRatings
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
        
        // Decrypt the WhatsApp number before sending it to the client
        if (user.whatsapp_number) {
            user.whatsapp_number = decrypt(user.whatsapp_number);
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
        
        // Validate phone number format if provided
        if (whatsapp_number && !validatePhoneNumber(whatsapp_number)) {
            return res.status(400).json({ error: 'Invalid phone number format. Please enter a valid phone number.' });
        }
        
        // Encrypt the WhatsApp number before storing
        const encryptedWhatsApp = whatsapp_number ? encrypt(whatsapp_number) : null;
        
        const result = await pool.query(`
            UPDATE users 
            SET university_stream = $1,
                whatsapp_number = $2,
                writer_status = $3
            WHERE id = $4
            RETURNING *
        `, [university_stream, encryptedWhatsApp, writer_status, req.user.id]);
        
        if (result.rows.length === 0) {
            console.log('User not found for ID:', req.user.id);
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Decrypt the WhatsApp number before sending it back to the client
        const user = result.rows[0];
        if (user.whatsapp_number) {
            user.whatsapp_number = decrypt(user.whatsapp_number);
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
        
        await pool.query(
            'UPDATE users SET whatsapp_number = $1 WHERE id = $2',
            [encrypt(whatsapp_number), userId]
        );
        
        res.json({ message: 'WhatsApp number updated successfully' });
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

// Get user's assignments (temporary version without authentication for testing)
app.get('/api/my-assignments-test', async (req, res) => {
    try {
        // For testing purposes, we'll return generic sample data
        const sampleData = {
            role: 'client',
            assignments: [
                {
                    id: 1,
                    request_id: 1,
                    writer: {
                        id: 2,
                        name: 'Writer Name',
                        email: 'writer@example.com',
                        profile_picture: '',
                        rating: 4.5, // Ensure this is a number
                        total_ratings: 3,
                        whatsapp_number: '1234567890'
                    },
                    client: {
                        id: 1,
                        name: 'Client Name',
                        email: 'client@example.com',
                        profile_picture: '',
                        rating: 4.0, // Ensure this is a number
                        total_ratings: 2,
                        whatsapp_number: '0987654321'
                    },
                    status: 'in_progress',
                    created_at: '2023-01-01T00:00:00Z',
                    completed_at: null,
                    course_name: 'Sample Course',
                    course_code: 'CS101',
                    assignment_type: 'Assignment',
                    num_pages: 5,
                    deadline: '2023-04-15T00:00:00Z',
                    estimated_cost: 500,
                    has_rated_writer: false,
                    has_rated_client: false
                }
            ]
        };
        
        res.json(sampleData);
    } catch (error) {
        console.error('Error in test endpoint:', error);
        res.status(500).json({ error: 'Server error' });
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