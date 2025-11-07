# Migration Guide: MongoDB to MySQL

This guide will help you migrate your stock trading application from MongoDB to MySQL.

## Prerequisites

1. MySQL server installed and running (version 8.0 or higher recommended)
2. Node.js and npm installed
3. Access to your MySQL database

## Step 1: Set up MySQL Database

1. Create a new MySQL database:
```sql
CREATE DATABASE signalist_stock_tracker;
```

2. Create a MySQL user with appropriate permissions:
```sql
CREATE USER 'signalist_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON signalist_stock_tracker.* TO 'signalist_user'@'localhost';
FLUSH PRIVILEGES;
```

## Step 2: Configure Environment Variables

Update your `.env` file with the MySQL connection string:

```env
# Remove or comment out MongoDB URI
# MONGODB_URI=mongodb://...

# Add MySQL connection string
DATABASE_URL="mysql://signalist_user:your_password@localhost:3306/signalist_stock_tracker"

# Keep your other environment variables
BETTER_AUTH_SECRET=your_secret
BETTER_AUTH_URL=http://localhost:3000
FINNHUB_API_KEY=your_finnhub_key
NEXT_PUBLIC_FINNHUB_API_KEY=your_finnhub_key
```

## Step 3: Generate Prisma Client

Run the following command to generate the Prisma client:

```bash
npx prisma generate
```

## Step 4: Run Database Migrations

Create and apply the database schema:

```bash
npx prisma migrate dev --name init
```

This will:
- Create all the necessary tables (User, Session, Account, Verification, WatchlistItem, Transaction, PortfolioHolding)
- Set up proper indexes and relationships
- Generate migration files in `prisma/migrations/`

## Step 5: Migrate Existing Data (Optional)

If you have existing data in MongoDB that you want to migrate:

1. Export your MongoDB data:
```bash
mongoexport --db your_db_name --collection watchlist --out watchlist.json
mongoexport --db your_db_name --collection user --out user.json
```

2. Create a migration script to import the data into MySQL (you'll need to adapt the data format).

## Step 6: Verify the Migration

1. Start your development server:
```bash
npm run dev
```

2. Test the following features:
   - User authentication (sign up, sign in)
   - Adding stocks to watchlist
   - Buying stocks
   - Selling stocks
   - Viewing portfolio
   - Transaction history

## Step 7: Remove MongoDB Dependencies (Optional)

Once you've verified everything works:

1. Remove MongoDB packages:
```bash
npm uninstall mongoose mongodb
```

2. Remove MongoDB-related files:
   - `database/mongoose.ts`
   - `database/models/watchlist.model.ts` (old MongoDB model)
   - `scripts/test-db.mjs` and `scripts/test-db.ts` (update if needed)

## Database Schema

The MySQL database includes the following tables:

### User
- Stores user accounts (managed by better-auth)
- Fields: id, name, email, emailVerified, image, createdAt, updatedAt, country

### Session
- Stores user sessions (managed by better-auth)
- Fields: id, userId, expiresAt, token, ipAddress, userAgent, createdAt, updatedAt

### Account
- Stores OAuth accounts (managed by better-auth)
- Fields: id, userId, accountId, providerId, accessToken, refreshToken, expiresAt, password, createdAt, updatedAt

### Verification
- Stores email verification tokens (managed by better-auth)
- Fields: id, identifier, value, expiresAt, createdAt, updatedAt

### WatchlistItem
- Stores user watchlist items
- Fields: id, userId, symbol, company, addedAt
- Unique constraint on (userId, symbol)

### Transaction
- Stores buy/sell transactions
- Fields: id, userId, symbol, company, type, quantity, price, totalAmount, executedAt

### PortfolioHolding
- Stores current portfolio holdings
- Fields: id, userId, symbol, company, quantity, averageBuyPrice, totalCost, updatedAt
- Unique constraint on (userId, symbol)

## Troubleshooting

### Connection Issues
- Verify MySQL server is running
- Check database credentials in `.env`
- Ensure database exists and user has proper permissions

### Prisma Client Issues
- Run `npx prisma generate` after schema changes
- Clear `.next` cache: `rm -rf .next`

### Migration Issues
- Reset database (development only): `npx prisma migrate reset`
- Check migration status: `npx prisma migrate status`

## New Features

With the MySQL migration, you now have:

1. **Buy/Sell Transactions**: Users can buy and sell stocks
2. **Portfolio Management**: Track holdings with average buy price and total cost
3. **Portfolio Analysis**: View portfolio value, gains/losses, and performance metrics
4. **Transaction History**: Complete history of all buy/sell transactions

## Next Steps

1. Set up production database
2. Configure database backups
3. Monitor database performance
4. Consider adding indexes for frequently queried fields
5. Implement portfolio analytics and charts

