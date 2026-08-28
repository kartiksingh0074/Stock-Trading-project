"use client";

import { useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { NetWorthPoint } from "@/lib/actions/wallet.actions";

// Net worth here is cost-basis-based (cash + invested cost, not live market value) —
// see PortfolioSnapshot. The chart is honest about that in its subtitle.
const SERIES_COLOR = "#D13BFF"; // purple-500 — already means "net worth" in PortfolioSummary.tsx

const RANGES = [
  { label: "7D", days: 7 },
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
  { label: "All", days: 3650 },
] as const;

function formatCurrency(value: number) {
  return `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: NetWorthPoint }> }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-lg">
      <p className="text-xs text-gray-500 mb-1">{formatDate(point.capturedAt)}</p>
      <p className="text-lg font-bold text-gray-100">{formatCurrency(point.netWorth)}</p>
      <div className="mt-1 space-y-0.5 text-xs text-gray-400">
        <p>Cash: {formatCurrency(point.cashBalance)}</p>
        <p>Invested (cost basis): {formatCurrency(point.investedValue)}</p>
      </div>
    </div>
  );
}

export default function NetWorthChart({ history }: { history: NetWorthPoint[] }) {
  const [rangeDays, setRangeDays] = useState<number>(90);
  const [showTable, setShowTable] = useState(false);

  const filtered = useMemo(() => {
    const cutoff = Date.now() - rangeDays * 24 * 60 * 60 * 1000;
    return history.filter((p) => new Date(p.capturedAt).getTime() >= cutoff);
  }, [history, rangeDays]);

  if (history.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-1">Net Worth Over Time</h2>
        <p className="text-sm text-gray-500 mb-6">Cost basis (cash + invested), not live market value</p>
        <p className="text-gray-400 text-sm">
          No history yet — this fills in as you trade.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold mb-1">Net Worth Over Time</h2>
          <p className="text-sm text-gray-500">Cost basis (cash + invested), not live market value</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-gray-900 rounded-lg p-1">
            {RANGES.map((r) => (
              <button
                key={r.label}
                onClick={() => setRangeDays(r.days)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  rangeDays === r.days ? "bg-gray-700 text-gray-100" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowTable((v) => !v)}
            className="px-3 py-1 text-sm rounded-md text-gray-500 hover:text-gray-300 transition-colors"
          >
            {showTable ? "Show chart" : "Show table"}
          </button>
        </div>
      </div>

      {showTable ? (
        <div className="overflow-x-auto max-h-80">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700 text-gray-500 text-left">
                <th className="py-2 pr-4 font-medium">Date</th>
                <th className="py-2 pr-4 font-medium">Cash</th>
                <th className="py-2 pr-4 font-medium">Invested</th>
                <th className="py-2 font-medium">Net Worth</th>
              </tr>
            </thead>
            <tbody className="tabular-nums">
              {filtered.map((p, i) => (
                <tr key={i} className="border-b border-gray-700/50">
                  <td className="py-2 pr-4 text-gray-400">{formatDate(p.capturedAt)}</td>
                  <td className="py-2 pr-4 text-gray-300">{formatCurrency(p.cashBalance)}</td>
                  <td className="py-2 pr-4 text-gray-300">{formatCurrency(p.investedValue)}</td>
                  <td className="py-2 text-gray-100 font-semibold">{formatCurrency(p.netWorth)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={filtered} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="netWorthFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={SERIES_COLOR} stopOpacity={0.1} />
                <stop offset="100%" stopColor={SERIES_COLOR} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#212328" strokeWidth={1} />
            <XAxis
              dataKey="capturedAt"
              tickFormatter={formatDate}
              stroke="#9095A1"
              tick={{ fill: "#9095A1", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              minTickGap={40}
            />
            <YAxis
              tickFormatter={formatCurrency}
              stroke="#9095A1"
              tick={{ fill: "#9095A1", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={70}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#30333A", strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey="netWorth"
              stroke={SERIES_COLOR}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="url(#netWorthFill)"
              dot={false}
              activeDot={{ r: 4, fill: SERIES_COLOR, stroke: "#141414", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
