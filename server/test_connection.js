import mysql from 'mysql2/promise';

async function testConnection() {
    try {
        console.log('Testing database connection...');
        
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'job_pass_user',
            password: 'jobpass2024',
            database: 'job_pass'
        });

        console.log('✅ Connected to MySQL successfully!');

        // Test query
        const [rows] = await connection.execute('SHOW TABLES');
        console.log('📋 Tables in database:', rows);

        // Test table structure
        const [users] = await connection.execute('DESCRIBE users');
        console.log('👤 Users table structure:', users.length, 'columns');

        await connection.end();
        console.log('✅ Connection test completed successfully!');
        
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        process.exit(1);
    }
}

testConnection();
