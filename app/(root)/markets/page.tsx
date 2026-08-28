import Link from "next/link";
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getStockQuote, getStockProfile } from "@/lib/actions/finnhub.actions";
import { POPULAR_STOCK_SYMBOLS } from "@/lib/constants";
import MarketsGrid, { type MarketStock } from "@/components/MarketsGrid";

// Capped to keep the page fast and go easy on the Finnhub rate limit — quotes and
// profiles are cached (60s / 1hr respectively, see finnhub.actions.ts), but a cold
// cache still means this many parallel outbound requests.
const MARKET_SYMBOLS = POPULAR_STOCK_SYMBOLS.slice(0, 20);

export default async function MarketsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/sign-in");
  }

  const stocks = (
    await Promise.all(
      MARKET_SYMBOLS.map(async (symbol): Promise<MarketStock | null> => {
        const [quote, profile] = await Promise.all([getStockQuote(symbol), getStockProfile(symbol)]);
        if (!quote) return null;
        return {
          symbol,
          company: profile?.name ?? symbol,
          price: quote.price,
          changePercent: quote.changePercent,
        };
      })
    )
  ).filter((s): s is MarketStock => s !== null);

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Markets</h1>
        <p className="text-gray-500">
          Live movers across popular stocks — see the broader{" "}
          <Link href="/" className="text-yellow-500 hover:underline">
            market overview
          </Link>{" "}
          for indices and the sector heatmap.
        </p>
      </div>

      <MarketsGrid stocks={stocks} />
    </div>
  );
}
