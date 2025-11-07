"use client";

import { format } from "date-fns";

interface Transaction {
  id: string;
  symbol: string;
  company: string;
  type: string;
  quantity: number;
  price: number | { toNumber: () => number };
  totalAmount: number | { toNumber: () => number };
  executedAt: Date;
}

function toNumber(value: number | { toNumber: () => number }): number {
  return typeof value === 'number' ? value : value.toNumber();
}

interface TransactionHistoryProps {
  transactions: Transaction[];
}

export default function TransactionHistory({ transactions }: TransactionHistoryProps) {
  if (transactions.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Transaction History</h2>
        <p className="text-gray-400">No transactions yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">Recent Transactions</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Date</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Symbol</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Type</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">Quantity</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">Price</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">Total</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => {
              const isBuy = transaction.type === "BUY";
              const typeColor = isBuy ? "text-green-500" : "text-red-500";

              return (
                <tr key={transaction.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                  <td className="py-3 px-4 text-sm">
                    {format(new Date(transaction.executedAt), "MMM dd, yyyy HH:mm")}
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-semibold">{transaction.symbol}</div>
                      <div className="text-xs text-gray-400">{transaction.company}</div>
                    </div>
                  </td>
                  <td className={`py-3 px-4 font-semibold ${typeColor}`}>
                    {transaction.type}
                  </td>
                  <td className="py-3 px-4 text-right">{transaction.quantity}</td>
                  <td className="py-3 px-4 text-right">${toNumber(transaction.price).toFixed(2)}</td>
                  <td className="py-3 px-4 text-right font-semibold">
                    ${toNumber(transaction.totalAmount).toFixed(2)}
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

