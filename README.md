# 📈 Stock Trading Application

A full-stack stock trading simulator built with Next.js 15, MySQL, and Prisma. Track your portfolio, buy/sell stocks, and analyze your investments with real-time market data.

![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=flat-square&logo=next.js)
![MySQL](https://img.shields.io/badge/MySQL-8.0-blue?style=flat-square&logo=mysql)
![Prisma](https://img.shields.io/badge/Prisma-6.19-2D3748?style=flat-square&logo=prisma)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)

## ✨ Features

### 🔐 Authentication
- Secure email/password authentication with Better Auth
- Session management
- User profiles with investment preferences

### 💰 Trading System
- **$10,000 starting balance** for all users
- **Buy stocks** with real-time price validation
- **Sell stocks** with automatic balance updates
- Transaction history tracking
- Insufficient funds validation

### 📊 Portfolio Management
- Real-time portfolio valuation
- Holdings overview with current prices
- Gain/loss tracking (amount & percentage)
- Average buy price calculation
- Total net worth display (cash + stocks)

### 📈 Market Data
- Real-time stock quotes from Finnhub API
- Stock search with 10,000+ symbols
- Company profiles and information
- TradingView charts integration
- Market news and updates

### 👀 Watchlist
- Add/remove stocks to watchlist
- Track favorite stocks
- Quick access to watched stocks

## 🚀 Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Shadcn/ui** - Component library
- **TradingView Widgets** - Advanced charts

### Backend
- **MySQL** - Relational database
- **Prisma** - Type-safe ORM
- **Better Auth** - Authentication
- **Server Actions** - API endpoints

### APIs & Services
- **Finnhub API** - Real-time stock data

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- MySQL 8.0+
- Finnhub API key (free tier available)

### 1. Clone the Repository

```bash
git clone https://github.com/kartiksingh0074/Stock-Trading-project.git
cd Stock-Trading-project
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up MySQL Database

Create a new MySQL database:

```sql
CREATE DATABASE stock_db;
```

### 4. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="mysql://username:password@localhost:3306/stock_db"

# Better Auth
BETTER_AUTH_SECRET="your-secret-key-min-32-characters-long"
BETTER_AUTH_URL="http://localhost:3000"

# Finnhub API (Get free key from https://finnhub.io/)
FINNHUB_API_KEY="your_finnhub_api_key"
NEXT_PUBLIC_FINNHUB_API_KEY="your_finnhub_api_key"
```

**Generate BETTER_AUTH_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Get Finnhub API Key:**
1. Visit https://finnhub.io/
2. Sign up (free)
3. Copy your API key

### 5. Generate Prisma Client & Run Migrations

```bash
npm run db:generate
npm run db:migrate
```

When prompted for migration name, enter: `init`

### 6. Start the Development Server

```bash
npm run dev
```

Visit **http://localhost:3000** 🎉

## 📖 Usage Guide

### Getting Started

1. **Sign Up**
   - Create an account at `/sign-up`
   - You'll start with **$10,000** virtual cash

2. **Search for Stocks**
   - Click "Search" in navigation or press `Ctrl + K`
   - Search for any stock (e.g., AAPL, TSLA, MSFT)

3. **Buy Stocks**
   - Click on a stock from search results
   - Click the green **"Buy"** button
   - Enter quantity and price (or use current market price)
   - Confirm purchase

4. **View Portfolio**
   - Navigate to `/portfolio`
   - See your holdings, cash balance, and total net worth
   - Track gains/losses for each position

5. **Sell Stocks**
   - Go to stock detail page
   - Click the red **"Sell"** button
   - Enter quantity to sell
   - Cash is added back to your balance

6. **Manage Watchlist**
   - Add stocks to watchlist for quick tracking
   - Access from any stock detail page

## 🗄️ Database Schema

### Core Tables

- **User** - User accounts with cash balance
- **Session** - Authentication sessions
- **Account** - Password storage
- **WatchlistItem** - User's watchlist
- **Transaction** - Buy/sell history
- **PortfolioHolding** - Current stock positions

## 🛠️ Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run database migrations
npm run db:studio    # Open Prisma Studio
npm run db:push      # Push schema to database
```

## 📁 Project Structure

```
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication pages
│   ├── (root)/            # Protected pages
│   │   ├── portfolio/     # Portfolio dashboard
│   │   └── stocks/        # Stock detail pages
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # Shadcn components
│   ├── BuySellButtons.tsx
│   ├── TransactionDialog.tsx
│   ├── PortfolioSummary.tsx
│   └── HoldingsTable.tsx
├── lib/
│   ├── actions/          # Server actions
│   │   ├── transaction.actions.ts
│   │   ├── portfolio.actions.ts
│   │   └── wallet.actions.ts
│   ├── better-auth/      # Auth configuration
│   └── prisma.ts         # Prisma client
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── migrations/       # Migration files
└── public/               # Static assets
```

## 🔒 Security Features

- ✅ Secure password hashing with Better Auth
- ✅ Session-based authentication
- ✅ SQL injection protection via Prisma
- ✅ Environment variable protection
- ✅ CSRF protection
- ✅ Secure cookie handling

## 🌟 Key Features Explained

### Portfolio Valuation
- Real-time portfolio value calculation
- Fetches current prices from Finnhub API
- Calculates gains/losses based on average buy price
- Shows total net worth (cash + holdings)

### Transaction System
- ACID-compliant transactions using Prisma
- Automatic cash balance updates
- Portfolio holdings auto-update
- Average buy price calculation on multiple purchases
- Validation for insufficient funds and shares

### Cash Balance System
- Each user starts with $10,000
- Cash is deducted when buying stocks
- Cash is added back when selling stocks
- Real-time balance tracking

## 📝 Future Enhancements

- [ ] Advanced charts and technical indicators
- [ ] Price alerts and notifications
- [ ] Portfolio performance analytics
- [ ] Dividend tracking
- [ ] Market sentiment analysis
- [ ] Social trading features
- [ ] Options trading
- [ ] Multiple currency support
- [ ] Mobile app (React Native)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 👨‍💻 Author

**Kartik Singh**
- GitHub: [@kartiksingh0074](https://github.com/kartiksingh0074)
- Email: bishtkartik249@gmail.com

## 🙏 Acknowledgments

- [Finnhub](https://finnhub.io/) - Stock market data API
- [TradingView](https://www.tradingview.com/) - Chart widgets
- [Better Auth](https://www.better-auth.com/) - Authentication library
- [Prisma](https://www.prisma.io/) - Database ORM
- [Shadcn/ui](https://ui.shadcn.com/) - Component library

## 📞 Support

If you have any questions or need help, please:
- Open an issue on GitHub
- Email: bishtkartik249@gmail.com

---

⭐ **Star this repository if you find it helpful!**

Made with ❤️ by Kartik Singh
