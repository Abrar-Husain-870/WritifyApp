const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Create a pool only if one is not provided
let defaultPool = null;

/**
 * Sets up the database tables if they don't exist
 * @param {Pool} [existingPool=null] - An existing database pool to use instead of creating a new one
 */
async function setupDatabase(existingPool = null) {
    // Use the provided pool or create a new one if not provided
    const pool = existingPool || getDefaultPool();
    let client;
    try {
        console.log('Connecting to database...');
        client = await pool.connect();
        console.log('✅ Connected to PostgreSQL database');
        
        // First, check if the users table already exists
        const checkTableResult = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'users'
            );
        `);
        
        const tablesExist = checkTableResult.rows[0].exists;
        
        if (tablesExist) {
            console.log('✅ Database tables already exist, skipping initialization');
            return;
        }
        
        // If tables don't exist, proceed with initialization
        console.log('No existing tables found, initializing database...');
        
        // Read and execute SQL file
        const sqlPath = path.join(__dirname, 'init.sql');
        console.log(`Reading SQL file from: ${sqlPath}`);
        const sqlContent = await fs.readFile(sqlPath, 'utf8');
        
        // Execute SQL commands
        console.log('Executing SQL commands...');
        await client.query(sqlContent);
        console.log('✅ Database tables created successfully');
    } catch (error) {
        console.error('❌ Error during database setup:', error);
        // Don't exit the process on error, just log it
        // process.exit(1);
    } finally {
        if (client) {
            client.release();
        }
        // Don't end the pool here as it will be used by the server
        // await pool.end(); - This was causing connection issues
    }
}

/**
 * Gets or creates the default database pool
 * @returns {Pool} The database connection pool
 */
function getDefaultPool() {
    if (!defaultPool) {
        defaultPool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
            // Add connection pool settings for better stability
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000
        });
        
        // Add error handler for the pool
        defaultPool.on('error', (err) => {
            console.error('Unexpected error on idle client in setupDatabase pool', err);
        });
    }
    return defaultPool;
}

// Run setup if this file is executed directly
if (require.main === module) {
    setupDatabase().then(() => {
        // Close the pool when running as a standalone script
        if (defaultPool) {
            defaultPool.end();
        }
    });
}

module.exports = { setupDatabase };