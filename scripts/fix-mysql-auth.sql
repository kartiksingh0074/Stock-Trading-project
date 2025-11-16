-- MySQL Authentication Fix Script
-- Run this script in your MySQL client to fix the sha256_password authentication issue

-- Option 1: Change existing user to mysql_native_password (Recommended)
-- Replace 'your_username', 'your_password', and 'localhost' with your actual values
ALTER USER 'your_username'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
FLUSH PRIVILEGES;

-- Option 2: Change to caching_sha2_password (MySQL 8.0+ default)
-- ALTER USER 'your_username'@'localhost' IDENTIFIED WITH caching_sha2_password BY 'your_password';
-- FLUSH PRIVILEGES;

-- Option 3: Create a new user with compatible authentication
-- CREATE USER 'new_user'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
-- GRANT ALL PRIVILEGES ON stock_db.* TO 'new_user'@'localhost';
-- FLUSH PRIVILEGES;

-- Check current authentication plugin for a user
-- SELECT user, host, plugin FROM mysql.user WHERE user = 'your_username';

