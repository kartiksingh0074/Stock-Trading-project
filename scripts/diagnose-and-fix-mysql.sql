-- MySQL Connection Diagnostic and Fix Script
-- Run this script as root or admin user in MySQL

-- Step 1: Check if the user exists and what hosts it's configured for
SELECT user, host, plugin, authentication_string 
FROM mysql.user 
WHERE user = 'user';

-- Step 2: Check if the database exists
SHOW DATABASES LIKE 'stock_db';

-- Step 3: Fix the user (choose the appropriate option based on Step 1 results)

-- Option A: If user exists for 'localhost' but password/auth is wrong
-- Replace 'your_password' with your actual password
ALTER USER 'user'@'localhost' IDENTIFIED WITH caching_sha2_password BY 'your_password';
FLUSH PRIVILEGES;

-- Option B: If user exists for '%' (any host) but you're connecting from localhost
-- Create/update user for localhost specifically
CREATE USER IF NOT EXISTS 'user'@'localhost' IDENTIFIED WITH caching_sha2_password BY 'your_password';
GRANT ALL PRIVILEGES ON stock_db.* TO 'user'@'localhost';
FLUSH PRIVILEGES;

-- Option C: If user doesn't exist, create it
CREATE USER 'user'@'localhost' IDENTIFIED WITH caching_sha2_password BY 'your_password';
GRANT ALL PRIVILEGES ON stock_db.* TO 'user'@'localhost';
FLUSH PRIVILEGES;

-- Option D: If you want to allow from both localhost and any host
CREATE USER IF NOT EXISTS 'user'@'localhost' IDENTIFIED WITH caching_sha2_password BY 'your_password';
CREATE USER IF NOT EXISTS 'user'@'%' IDENTIFIED WITH caching_sha2_password BY 'your_password';
GRANT ALL PRIVILEGES ON stock_db.* TO 'user'@'localhost';
GRANT ALL PRIVILEGES ON stock_db.* TO 'user'@'%';
FLUSH PRIVILEGES;

-- Step 4: Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS stock_db;

-- Step 5: Verify the fix
SELECT user, host, plugin FROM mysql.user WHERE user = 'user';
SHOW GRANTS FOR 'user'@'localhost';

