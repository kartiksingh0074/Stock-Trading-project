"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown } from "lucide-react";
import { formatPrice, formatChangePercent, getChangeColorClass } from "@/lib/utils";

export interface MarketStock {
  symbol: string;
  company: string;
  price: number;
  changePercent: number;
}

type FilterKey = "all" | "gainers" | "losers";

export default function MarketsGrid({ stocks }: { stocks: MarketStock[] }) {
  const [filterKey, setFilterKey] = useState<FilterKey>("all");

  const visible = useMemo(() => {
    let result = stocks;
    if (filterKey === "gainers") result = result.filter((s) => s.changePercent > 0);
    if (filterKey === "losers") result = result.filter((s) => s.changePercent < 0);
    return [...result].sort((a, b) => b.changePercent - a.changePercent);
  }, [stocks, filterKey]);

  if (stocks.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <p className="text-gray-400 text-sm">Market data is temporarily unavailable — try again shortly.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-gray-800 rounded-lg p-1 w-fit">
        {(["all", "gainers", "losers"] as const).map((key) => (
          <button
            key={key}
            onClick={() => setFilterKey(key)}
            className={`px-3 py-1 text-sm rounded-md capitalize transition-colors ${
              filterKey === key ? "bg-gray-700 text-gray-100" : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {key}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="text-gray-400 text-sm">No stocks match this filter right now.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {visible.map((stock) => {
            const isPositive = stock.changePercent > 0;
            return (
              <Link
                key={stock.symbol}
                href={`/stocks/${stock.symbol}`}
                className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold">{stock.symbol}</p>
                    <p className="text-xs text-gray-400 truncate max-w-[140px]">{stock.company}</p>
                  </div>
                  {isPositive ? (
                    <TrendingUp className="h-4 w-4 text-green-500 shrink-0" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500 shrink-0" />
                  )}
                </div>
                <p className="text-lg font-bold">{formatPrice(stock.price)}</p>
                <p className={`text-sm ${getChangeColorClass(stock.changePercent)}`}>
                  {formatChangePercent(stock.changePercent)}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
