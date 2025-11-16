"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { TrendingUp, TrendingDown } from "lucide-react";
import WatchlistButton from "./WatchlistButton";
import { formatPrice, formatChangePercent, getChangeColorClass } from "@/lib/utils";

interface WatchlistItem {
  id: string;
  symbol: string;
  company: string;
  addedAt: Date;
  currentPrice?: number;
  changePercent?: number;
  marketCap?: string;
  peRatio?: string;
  logo?: string;
}

interface WatchlistTableProps {
  watchlist: WatchlistItem[];
  userId: string;
}

// Function to get stock logo URL (using Finnhub logo endpoint)
const getStockLogoUrl = (symbol: string): string => {
  // Finnhub provides logos via their API
  return `https://finnhub.io/api/logo?symbol=${encodeURIComponent(symbol.toUpperCase())}`;
};

export default function WatchlistTable({ watchlist, userId }: WatchlistTableProps) {
  if (watchlist.length === 0) {
    return (
      <div className="watchlist-empty-container">
        <div className="watchlist-empty">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="watchlist-star"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.385a.563.563 0 00-.182-.557L3.04 10.385a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345l2.125-5.111z"
            />
          </svg>
          <h2 className="empty-title">Your Watchlist is Empty</h2>
          <p className="empty-description">
            Start building your watchlist by adding stocks you want to track. Click the star icon on any stock page to add it here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="watchlist-table">
      <table className="w-full">
        <thead>
          <tr className="table-header-row">
            <th className="text-left py-2 px-3 text-xs font-semibold">Stock</th>
            <th className="text-right py-2 px-3 text-xs font-semibold">Price</th>
            <th className="text-right py-2 px-3 text-xs font-semibold">Change</th>
            <th className="text-right py-2 px-3 text-xs font-semibold">Market Cap</th>
            <th className="text-right py-2 px-3 text-xs font-semibold">P/E</th>
            <th className="text-center py-2 px-3 text-xs font-semibold">Action</th>
          </tr>
        </thead>
        <tbody>
          {watchlist.map((item) => {
            return <WatchlistRow key={item.id} item={item} userId={userId} />;
          })}
        </tbody>
      </table>
    </div>
  );
}

function WatchlistRow({ item, userId }: { item: WatchlistItem; userId: string }) {
  const [imageError, setImageError] = useState(false);
  const isPositive = (item.changePercent ?? 0) >= 0;
  const changeColorClass = getChangeColorClass(item.changePercent);
  const logoUrl = item.logo || getStockLogoUrl(item.symbol);

  return (
    <tr className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors">
      <td className="py-2 px-3">
        <Link
          href={`/stocks/${item.symbol}`}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="relative w-8 h-8 flex-shrink-0 rounded overflow-hidden bg-gray-700 flex items-center justify-center">
            {!imageError ? (
              <Image
                src={logoUrl}
                alt={`${item.company} logo`}
                width={32}
                height={32}
                className="w-full h-full object-contain"
                onError={() => setImageError(true)}
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs font-semibold">
                {item.symbol.substring(0, 2)}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm text-gray-100 truncate">{item.symbol}</div>
            <div className="text-xs text-gray-400 truncate">{item.company}</div>
          </div>
        </Link>
      </td>
      <td className="py-2 px-3 text-right">
        <div className="text-sm font-medium text-gray-100">
          {item.currentPrice ? formatPrice(item.currentPrice) : "N/A"}
        </div>
      </td>
      <td className={`py-2 px-3 text-right ${changeColorClass}`}>
        {item.changePercent !== undefined ? (
          <div className="flex items-center justify-end gap-1">
            {isPositive ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            <span className="text-sm font-medium">{formatChangePercent(item.changePercent)}</span>
          </div>
        ) : (
          <span className="text-sm text-gray-400">N/A</span>
        )}
      </td>
      <td className="py-2 px-3 text-right">
        <div className="text-xs text-gray-400">
          {item.marketCap || "N/A"}
        </div>
      </td>
      <td className="py-2 px-3 text-right">
        <div className="text-xs text-gray-400">
          {item.peRatio || "N/A"}
        </div>
      </td>
      <td className="py-2 px-3 text-center">
        <WatchlistButton
          symbol={item.symbol}
          company={item.company}
          isInWatchlist={true}
          showTrashIcon={true}
          type="icon"
          userId={userId}
          onWatchlistChange={() => {
            // Reload page after removal
            window.location.reload();
          }}
        />
      </td>
    </tr>
  );
}

