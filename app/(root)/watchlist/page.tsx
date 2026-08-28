import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getWatchlist } from "@/lib/actions/watchlist.actions";
import { getStockProfile, getStockQuote } from "@/lib/actions/finnhub.actions";
import { getUserAlerts } from "@/lib/actions/alert.actions";
import WatchlistTable from "@/components/WatchlistTable";
import AlertsPanel from "@/components/AlertsPanel";
import { formatMarketCapValue } from "@/lib/utils";

export default async function WatchlistPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect('/sign-in');
  }

  const userId = session.user.id;

  // Fetch watchlist items
  const watchlistItems = await getWatchlist();
  const alerts = await getUserAlerts();

  // Fetch current prices and additional data for each watchlist item
  const watchlistWithData = await Promise.all(
    watchlistItems.map(async (item) => {
      try {
        // Fetch current price
        const quote = await getStockQuote(item.symbol);
        
        // Fetch full profile for market cap and P/E ratio
        const profile = await getStockProfile(item.symbol);
        
        // Get logo URL from Finnhub profile or use default
        const logoUrl = profile?.logo 
          ? profile.logo
          : `https://finnhub.io/api/logo?symbol=${encodeURIComponent(item.symbol.toUpperCase())}`;

        return {
          id: item.id,
          symbol: item.symbol,
          company: item.company,
          addedAt: item.addedAt,
          currentPrice: quote?.price,
          changePercent: quote?.changePercent,
          marketCap: profile?.marketCapitalization 
            ? formatMarketCapValue(profile.marketCapitalization) 
            : undefined,
          peRatio: profile?.pe ? profile.pe.toFixed(2) : undefined,
          logo: logoUrl,
        };
      } catch (error) {
        console.error(`Error fetching data for ${item.symbol}:`, error);
        return {
          id: item.id,
          symbol: item.symbol,
          company: item.company,
          addedAt: item.addedAt,
        };
      }
    })
  );

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="watchlist-title">Watchlist</h1>
          <p className="text-gray-500 mt-2">
            Track your favorite stocks and monitor their performance
          </p>
        </div>
        <div className="text-sm text-gray-400">
          {watchlistWithData.length} {watchlistWithData.length === 1 ? 'stock' : 'stocks'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <WatchlistTable watchlist={watchlistWithData} userId={userId} />
        </div>
        <AlertsPanel alertData={alerts} />
      </div>
    </div>
  );
}

