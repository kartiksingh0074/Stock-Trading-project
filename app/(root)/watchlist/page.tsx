import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getWatchlistByUserId } from "@/lib/actions/watchlist.actions";
import { getStockQuote } from "@/lib/actions/finnhub.actions";
import WatchlistTable from "@/components/WatchlistTable";
import { formatMarketCapValue } from "@/lib/utils";

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY ?? process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? '';

async function fetchStockProfile(symbol: string) {
  try {
    if (!FINNHUB_API_KEY) return null;
    
    const url = `${FINNHUB_BASE_URL}/stock/profile2?symbol=${encodeURIComponent(symbol.toUpperCase())}&token=${FINNHUB_API_KEY}`;
    const response = await fetch(url, { next: { revalidate: 3600 } });
    
    if (!response.ok) return null;
    
    const profile = await response.json();
    return profile;
  } catch (error) {
    console.error(`Error fetching profile for ${symbol}:`, error);
    return null;
  }
}

export default async function WatchlistPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect('/sign-in');
  }

  const userId = session.user.id;

  // Fetch watchlist items
  const watchlistItems = await getWatchlistByUserId(userId);

  // Fetch current prices and additional data for each watchlist item
  const watchlistWithData = await Promise.all(
    watchlistItems.map(async (item) => {
      try {
        // Fetch current price
        const quote = await getStockQuote(item.symbol);
        
        // Fetch full profile for market cap and P/E ratio
        const profile = await fetchStockProfile(item.symbol);
        
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

      <WatchlistTable watchlist={watchlistWithData} userId={userId} />
    </div>
  );
}

