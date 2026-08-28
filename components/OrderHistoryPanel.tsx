"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import TransactionHistory from "@/components/TransactionHistory";

interface Transaction {
  id: string;
  symbol: string;
  company: string;
  type: string;
  quantity: number;
  price: number;
  totalAmount: number;
  executedAt: Date;
}

type TypeFilter = "ALL" | "BUY" | "SELL";
type RangeFilter = "all" | 7 | 30 | 90;

const RANGES: { label: string; value: RangeFilter }[] = [
  { label: "All time", value: "all" },
  { label: "7D", value: 7 },
  { label: "30D", value: 30 },
  { label: "90D", value: 90 },
];

export default function OrderHistoryPanel({ transactions }: { transactions: Transaction[] }) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [rangeFilter, setRangeFilter] = useState<RangeFilter>("all");
  const [symbolQuery, setSymbolQuery] = useState("");

  const filtered = useMemo(() => {
    const cutoff = rangeFilter === "all" ? null : Date.now() - rangeFilter * 24 * 60 * 60 * 1000;
    const query = symbolQuery.trim().toUpperCase();

    return transactions.filter((t) => {
      if (typeFilter !== "ALL" && t.type !== typeFilter) return false;
      if (cutoff !== null && new Date(t.executedAt).getTime() < cutoff) return false;
      if (query && !t.symbol.toUpperCase().includes(query)) return false;
      return true;
    });
  }, [transactions, typeFilter, rangeFilter, symbolQuery]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
          {(["ALL", "BUY", "SELL"] as const).map((key) => (
            <button
              key={key}
              onClick={() => setTypeFilter(key)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                typeFilter === key ? "bg-gray-700 text-gray-100" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {key === "ALL" ? "All" : key}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
          {RANGES.map((r) => (
            <button
              key={r.label}
              onClick={() => setRangeFilter(r.value)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                rangeFilter === r.value ? "bg-gray-700 text-gray-100" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <Input
          placeholder="Filter by symbol..."
          value={symbolQuery}
          onChange={(e) => setSymbolQuery(e.target.value)}
          className="w-48 h-8 bg-gray-800 border-gray-600 text-gray-200"
        />
      </div>

      <TransactionHistory
        transactions={filtered}
        title={`Orders (${filtered.length})`}
        emptyMessage="No orders match these filters."
      />
    </div>
  );
}
