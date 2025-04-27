const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// Connect to the database
pool.connect()
    .then(() => console.log('Connected to PostgreSQL'))
    .catch(err => console.error('PostgreSQL connection error:', err));

async function addUniqueIdColumn() {
    try {
        console.log('Adding unique_id column to assignment_requests table...');
        
        // Check if the column already exists
        const checkResult = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'assignment_requests' AND column_name = 'unique_id'
        `);
        
        if (checkResult.rows.length === 0) {
            // Add the unique_id column
            await pool.query(`
                ALTER TABLE assignment_requests
                ADD COLUMN unique_id VARCHAR(6)
            `);
            console.log('Successfully added unique_id column');
            
            // Generate unique IDs for existing records
            console.log('Generating unique IDs for existing assignment requests...');
            const existingRequests = await pool.query('SELECT id FROM assignment_requests WHERE unique_id IS NULL');
            
            for (const row of existingRequests.rows) {
                const uniqueId = Math.floor(100000 + Math.random() * 900000).toString();
                await pool.query('UPDATE assignment_requests SET unique_id = $1 WHERE id = $2', [uniqueId, row.id]);
            }
            
            console.log(`Generated unique IDs for ${existingRequests.rowCount} existing assignment requests`);
        } else {
            console.log('unique_id column already exists, skipping...');
        }
        
        console.log('Migration completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await pool.end();
    }
}

addUniqueIdColumn();
