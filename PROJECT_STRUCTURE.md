# Project Structure: Frontend vs Backend Files

## 📱 Frontend Files (Client-Side / UI)

### React Components (`components/`)
- `BuySellButtons.tsx` - Buy/sell stock buttons
- `Header.tsx` - Navigation header
- `HoldingsTable.tsx` - Portfolio holdings display
- `NavItems.tsx` - Navigation menu items
- `PortfolioSummary.tsx` - Portfolio summary card
- `SearchCommand.tsx` - Stock search component
- `TradingViewWidget.tsx` - TradingView chart widget
- `TransactionDialog.tsx` - Buy/sell transaction dialog
- `TransactionHistory.tsx` - Transaction history table
- `UserDropdown.tsx` - User profile dropdown
- `WatchlistButton.tsx` - Add to watchlist button
- `forms/` - Form components (CountrySelectField, InputField, SelectField, FooterLink)
- `ui/` - Shadcn UI components (button, dialog, input, select, etc.)

### Pages (`app/`)
- `app/(auth)/sign-in/page.tsx` - Sign in page
- `app/(auth)/sign-up/page.tsx` - Sign up page
- `app/(auth)/layout.tsx` - Auth layout
- `app/(root)/page.tsx` - Home/dashboard page
- `app/(root)/portfolio/page.tsx` - Portfolio page
- `app/(root)/stocks/[symbol]/page.tsx` - Stock detail page
- `app/(root)/layout.tsx` - Main layout
- `app/layout.tsx` - Root layout
- `app/globals.css` - Global styles
- `app/favicon.ico` - Favicon

### Hooks (`hooks/`)
- `useDebounce.ts` - Debounce hook
- `useTradingViewWidget.tsx` - TradingView widget hook

### Public Assets (`public/`)
- `assets/icons/` - SVG icons
- `assets/images/` - Images

### Configuration (Frontend)
- `components.json` - Shadcn UI config
- `postcss.config.mjs` - PostCSS config
- `tailwindcss` - Styling (via package.json)

---

## ⚙️ Backend Files (Server-Side)

### Server Actions (`lib/actions/`)
- `auth.actions.ts` - Authentication (sign up, sign in, sign out)
- `finnhub.actions.ts` - Stock data API calls
- `portfolio.actions.ts` - Portfolio calculations
- `transaction.actions.ts` - Buy/sell transactions
- `user.actions.ts` - User data operations
- `wallet.actions.ts` - Cash balance operations
- `watchlist.actions.ts` - Watchlist operations

### Database (`database/`, `prisma/`)
- `database/mysql.ts` - MySQL connection helper
- `lib/prisma.ts` - Prisma client instance
- `prisma/schema.prisma` - Database schema definition
- `prisma/migrations/` - Database migration files
- `prisma.config.ts` - Prisma configuration

### Authentication (`lib/better-auth/`)
- `auth.ts` - Better Auth configuration

### Utilities (`lib/`)
- `constants.ts` - App constants
- `utils.ts` - Utility functions

### Middleware (`middleware/`)
- `index.ts` - Next.js middleware (auth, routing)

### API Routes (`app/api/`)
- Currently empty (removed Inngest route)

### Configuration (Backend)
- `next.config.ts` - Next.js configuration
- `tsconfig.json` - TypeScript configuration
- `eslint.config.mjs` - ESLint configuration
- `.env` - Environment variables (not in repo)

### Scripts (`scripts/`)
- `test-mysql-connection.mjs` - Database connection test
- `create-database.sql` - Database creation script
- `diagnose-and-fix-mysql.sql` - MySQL troubleshooting
- `fix-mysql-auth.sql` - Authentication fix script

---

## 🔄 Hybrid Files (Both Frontend & Backend)

### Next.js App Router
- All files in `app/` can contain both client and server code
- Files with `'use server'` are server actions
- Files with `'use client'` are client components
- Default is server-side (React Server Components)

### Types (`types/`)
- `global.d.ts` - Global TypeScript definitions

---

## 📦 Dependencies

### Frontend Dependencies
- `react`, `react-dom` - React framework
- `next` - Next.js framework
- `@radix-ui/*` - UI component library
- `lucide-react` - Icons
- `tailwindcss` - Styling
- `cmdk` - Command menu
- `sonner` - Toast notifications
- `react-hook-form` - Form handling
- `date-fns` - Date formatting

### Backend Dependencies
- `@prisma/client` - Database ORM
- `prisma` - Prisma CLI
- `mysql2` - MySQL driver
- `better-auth` - Authentication
- `dotenv` - Environment variables

---

## 🗂️ File Organization Summary

```
Frontend: components/, app/(pages), hooks/, public/
Backend: lib/actions/, database/, prisma/, middleware/
Shared: lib/utils.ts, lib/constants.ts, types/
```






