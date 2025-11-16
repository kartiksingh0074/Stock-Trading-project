import 'dotenv/config';
import mysql from 'mysql2/promise';

async function testConnection() {
  let url = process.env.DATABASE_URL;
  
  if (!url) {
    console.error('❌ ERROR: DATABASE_URL is not set in .env file');
    process.exit(1);
  }
  
  // Remove quotes if present (sometimes .env files have quotes around values)
  url = url.replace(/^["']|["']$/g, '');
  
  console.log('DEBUG: Raw env value:', process.env.DATABASE_URL);
  console.log('DEBUG: Cleaned URL:', url);

  // Parse the connection string using URL parsing to handle special characters in password
  let username, password, host, port, database;
  
  try {
    // Use URL parsing to properly handle special characters in password
    const parsedUrl = new URL(url);
    username = parsedUrl.username;
    password = decodeURIComponent(parsedUrl.password);
    host = parsedUrl.hostname;
    port = parsedUrl.port || '3306';
    database = parsedUrl.pathname.replace(/^\//, ''); // Remove leading slash
  } catch (e) {
    // Fallback to regex if URL parsing fails (for malformed URLs)
    const match = url.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    if (!match) {
      console.error('❌ ERROR: Invalid DATABASE_URL format');
      console.log('Expected format: mysql://username:password@host:port/database');
      console.log('Note: If password contains special characters like @, #, %, you need to URL-encode them');
      console.log('Example: @ becomes %40');
      process.exit(1);
    }
    const [, user, pass, h, p, db] = match;
    username = user;
    password = decodeURIComponent(pass);
    host = h;
    port = p;
    database = db;
  }

  console.log('\n🔍 Testing MySQL Connection...\n');
  console.log(`Raw DATABASE_URL: ${url.substring(0, 30)}...`); // Show first 30 chars for debugging
  console.log(`Host: ${host}:${port}`);
  console.log(`Database: ${database}`);
  console.log(`Username: ${username}`);
  console.log(`Password: ${password ? '***' + password.slice(-4) : 'NOT SET'}\n`);

  try {
    const connection = await mysql.createConnection({
      host,
      port: parseInt(port),
      user: username,
      password,
      database,
    });

    console.log('✅ Connection successful!');
    
    // Check authentication plugin
    const [rows] = await connection.execute(
      `SELECT user, host, plugin FROM mysql.user WHERE user = ?`,
      [username]
    );

    if (rows.length > 0) {
      console.log(`\n📊 Found ${rows.length} user account(s):\n`);
      rows.forEach((user) => {
        console.log(`   User: ${user.user}@${user.host}`);
        console.log(`   Plugin: ${user.plugin}`);
        console.log('');
      });
      
      const compatiblePlugins = ['mysql_native_password', 'caching_sha2_password'];
      const hasCompatible = rows.some(u => compatiblePlugins.includes(u.plugin));
      
      if (hasCompatible) {
        console.log('✅ Authentication plugin is compatible!');
      } else {
        const incompatible = rows.find(u => u.plugin === 'sha256_password');
        if (incompatible) {
          console.log('\n⚠️  WARNING: Your MySQL user is using sha256_password plugin');
          console.log('   This is not supported by mysql2 driver used by Prisma.\n');
          console.log('🔧 To fix this, run the following SQL command:\n');
          console.log(`   ALTER USER '${username}'@'${incompatible.host}' IDENTIFIED WITH mysql_native_password BY 'your_password';`);
          console.log(`   FLUSH PRIVILEGES;\n`);
        }
      }
    } else {
      console.log(`\n⚠️  User '${username}' not found in MySQL`);
      console.log('   You may need to create the user first.\n');
    }

    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Connection failed!\n');
    console.error('Error:', error.message);
    console.error('Error Code:', error.code);
    
    if (error.message.includes('sha256_password')) {
      console.log('\n🔧 SOLUTION:');
      console.log('Your MySQL user is using sha256_password authentication plugin.');
      console.log('You need to change it to mysql_native_password or caching_sha2_password.\n');
      console.log('Run this SQL command in MySQL:');
      console.log(`\n   ALTER USER '${username}'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';`);
      console.log('   FLUSH PRIVILEGES;\n');
      console.log('See scripts/fix-mysql-auth.sql for more options.\n');
    } else if (error.message.includes('Access denied')) {
      console.log('\n🔧 TROUBLESHOOTING ACCESS DENIED:\n');
      console.log('1. Check if the password is correct in your .env file');
      console.log('2. Verify the user exists and has the right host:');
      console.log(`   SELECT user, host, plugin FROM mysql.user WHERE user = '${username}';`);
      console.log('\n3. If user exists but host is different, try:');
      console.log(`   ALTER USER '${username}'@'localhost' IDENTIFIED WITH caching_sha2_password BY 'your_password';`);
      console.log('   FLUSH PRIVILEGES;');
      console.log('\n4. Or grant access from localhost:');
      console.log(`   CREATE USER IF NOT EXISTS '${username}'@'localhost' IDENTIFIED WITH caching_sha2_password BY 'your_password';`);
      console.log(`   GRANT ALL PRIVILEGES ON ${database}.* TO '${username}'@'localhost';`);
      console.log('   FLUSH PRIVILEGES;');
      console.log('\n5. Make sure the database exists:');
      console.log(`   CREATE DATABASE IF NOT EXISTS ${database};`);
    }
    
    process.exit(1);
  }
}

testConnection();

