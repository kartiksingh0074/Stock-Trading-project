"use client";

import { useMemo, useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import TransactionDialog from "@/components/TransactionDialog";

interface Holding {
  symbol: string;
  company: string;
  quantity: number;
  averageBuyPrice: number;
  totalCost: number;
  currentPrice?: number;
  currentValue?: number;
  gainLoss?: number;
  gainLossPercent?: number;
}

interface HoldingsTableProps {
  holdings: Holding[];
  userId: string;
}

type SortKey = "value" | "gainLoss" | "alphabetical";
type FilterKey = "all" | "gainers" | "losers";

export default function HoldingsTable({ holdings, userId }: HoldingsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("value");
  const [filterKey, setFilterKey] = useState<FilterKey>("all");
  const [tradeTarget, setTradeTarget] = useState<{ holding: Holding; type: "BUY" | "SELL" } | null>(null);

  const visibleHoldings = useMemo(() => {
    let result = holdings;
    if (filterKey === "gainers") result = result.filter((h) => (h.gainLoss ?? 0) > 0);
    if (filterKey === "losers") result = result.filter((h) => (h.gainLoss ?? 0) < 0);

    return [...result].sort((a, b) => {
      if (sortKey === "alphabetical") return a.symbol.localeCompare(b.symbol);
      if (sortKey === "gainLoss") return (b.gainLoss ?? 0) - (a.gainLoss ?? 0);
      return (b.currentValue ?? b.totalCost) - (a.currentValue ?? a.totalCost);
    });
  }, [holdings, sortKey, filterKey]);

  if (holdings.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Holdings</h2>
        <p className="text-gray-400">You don&apos;t have any holdings yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <h2 className="text-xl font-bold">Holdings</h2>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-gray-900 rounded-lg p-1">
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
          <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
            <SelectTrigger className="w-[140px] h-8 text-sm bg-gray-900 border-gray-600 text-gray-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600 text-white">
              <SelectItem value="value" className="focus:bg-gray-600 focus:text-white">Sort: Value</SelectItem>
              <SelectItem value="gainLoss" className="focus:bg-gray-600 focus:text-white">Sort: Gain/Loss</SelectItem>
              <SelectItem value="alphabetical" className="focus:bg-gray-600 focus:text-white">Sort: A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {visibleHoldings.length === 0 ? (
        <p className="text-gray-400 text-sm py-4">No holdings match this filter.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Symbol</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Quantity</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">Avg Price</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">Current</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">Value</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">G/L</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleHoldings.map((holding) => {
                const isPositive = (holding.gainLoss ?? 0) >= 0;
                const gainLossColor = isPositive ? "text-green-500" : "text-red-500";

                return (
                  <tr key={holding.symbol} className="border-b border-gray-700 hover:bg-gray-700/50">
                    <td className="py-3 px-4">
                      <div>
                        <div className="font-semibold">{holding.symbol}</div>
                        <div className="text-sm text-gray-400">{holding.company}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">{holding.quantity}</td>
                    <td className="py-3 px-4 text-right">${holding.averageBuyPrice.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right">
                      {holding.currentPrice ? `$${holding.currentPrice.toFixed(2)}` : "N/A"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {holding.currentValue ? `$${holding.currentValue.toFixed(2)}` : `$${holding.totalCost.toFixed(2)}`}
                    </td>
                    <td className={`py-3 px-4 text-right ${gainLossColor}`}>
                      {holding.gainLoss !== undefined ? (
                        <div className="flex items-center justify-end gap-1">
                          {isPositive ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )}
                          <span>
                            {isPositive ? "+" : ""}${holding.gainLoss.toFixed(2)}
                          </span>
                          {holding.gainLossPercent !== undefined && (
                            <span className="text-xs">
                              ({isPositive ? "+" : ""}{holding.gainLossPercent.toFixed(2)}%)
                            </span>
                          )}
                        </div>
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setTradeTarget({ holding, type: "BUY" })}
                        >
                          Buy
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setTradeTarget({ holding, type: "SELL" })}
                        >
                          Sell
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tradeTarget && (
        <TransactionDialog
          open={!!tradeTarget}
          onOpenChange={(open) => !open && setTradeTarget(null)}
          userId={userId}
          symbol={tradeTarget.holding.symbol}
          company={tradeTarget.holding.company}
          type={tradeTarget.type}
          currentHolding={{
            quantity: tradeTarget.holding.quantity,
            averageBuyPrice: tradeTarget.holding.averageBuyPrice,
          }}
        />
      )}
    </div>
  );
}
