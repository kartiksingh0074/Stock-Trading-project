"use client";

import { TrendingUp, TrendingDown } from "lucide-react";

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
}

export default function HoldingsTable({ holdings }: HoldingsTableProps) {
  if (holdings.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Holdings</h2>
        <p className="text-gray-400">You don't have any holdings yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">Holdings</h2>
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
            </tr>
          </thead>
          <tbody>
            {holdings.map((holding) => {
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
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

