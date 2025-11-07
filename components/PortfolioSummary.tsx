"use client";

import { PortfolioSummary as PortfolioSummaryType } from "@/lib/actions/portfolio.actions";
import { TrendingUp, TrendingDown, DollarSign, Package, Wallet } from "lucide-react";

interface PortfolioSummaryProps {
  summary: PortfolioSummaryType;
  cashBalance: number;
}

export default function PortfolioSummary({ summary, cashBalance }: PortfolioSummaryProps) {
  const isPositive = summary.totalGainLoss >= 0;
  const gainLossColor = isPositive ? "text-green-500" : "text-red-500";
  const totalNetWorth = summary.totalValue + cashBalance;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm mb-1">Total Net Worth</p>
            <p className="text-2xl font-bold">${totalNetWorth.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">Cash + Stocks</p>
          </div>
          <Wallet className="h-8 w-8 text-purple-500" />
        </div>
      </div>
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm mb-1">Total Value</p>
            <p className="text-2xl font-bold">${summary.totalValue.toFixed(2)}</p>
          </div>
          <DollarSign className="h-8 w-8 text-yellow-500" />
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm mb-1">Total Cost</p>
            <p className="text-2xl font-bold">${summary.totalCost.toFixed(2)}</p>
          </div>
          <Package className="h-8 w-8 text-blue-500" />
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm mb-1">Total Gain/Loss</p>
            <p className={`text-2xl font-bold ${gainLossColor}`}>
              {isPositive ? "+" : ""}${summary.totalGainLoss.toFixed(2)}
            </p>
          </div>
          {isPositive ? (
            <TrendingUp className="h-8 w-8 text-green-500" />
          ) : (
            <TrendingDown className="h-8 w-8 text-red-500" />
          )}
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm mb-1">Gain/Loss %</p>
            <p className={`text-2xl font-bold ${gainLossColor}`}>
              {isPositive ? "+" : ""}{summary.totalGainLossPercent.toFixed(2)}%
            </p>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-sm">{summary.totalHoldings} holdings</p>
          </div>
        </div>
      </div>
    </div>
  );
}

