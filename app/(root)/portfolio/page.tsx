import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getPortfolioSummary, getPortfolioHoldings } from "@/lib/actions/portfolio.actions";
import { getTransactionsByUserId } from "@/lib/actions/transaction.actions";
import { getStockQuote } from "@/lib/actions/finnhub.actions";
import { getUserBalance } from "@/lib/actions/wallet.actions";
import PortfolioSummary from "@/components/PortfolioSummary";
import HoldingsTable from "@/components/HoldingsTable";
import TransactionHistory from "@/components/TransactionHistory";

export default async function PortfolioPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect('/sign-in');
  }

  const userId = session.user.id;
  const cashBalance = await getUserBalance(userId);

  // Fetch portfolio data
  const holdings = await getPortfolioHoldings(userId);
  const transactions = await getTransactionsByUserId(userId, 50);

  // Fetch current prices for all holdings
  const currentPrices: Record<string, number> = {};
  if (holdings.length > 0) {
    await Promise.all(
      holdings.map(async (holding) => {
        try {
          const quote = await getStockQuote(holding.symbol);
          if (quote) {
            currentPrices[holding.symbol] = quote.price;
          }
        } catch (error) {
          console.error(`Error fetching price for ${holding.symbol}:`, error);
        }
      })
    );
  }

  const portfolioSummary = await getPortfolioSummary(userId, currentPrices);

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Portfolio</h1>
          <p className="text-gray-500">View and manage your stock holdings</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-gray-400 text-sm mb-1">Available Cash</p>
          <p className="text-2xl font-bold text-green-500">${cashBalance.toFixed(2)}</p>
        </div>
      </div>

      <PortfolioSummary summary={portfolioSummary} cashBalance={cashBalance} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <HoldingsTable holdings={portfolioSummary.holdings} />
        <TransactionHistory transactions={transactions} />
      </div>
    </div>
  );
}

