"use client";

import { useLivePolling } from "@/hooks/useLivePolling";
import { getUserBalance } from "@/lib/actions/wallet.actions";

export default function LiveBalance({ initialBalance }: { initialBalance: number }) {
  const { value: balance } = useLivePolling(getUserBalance, initialBalance, 20_000);

  return (
    <p className="text-3xl font-bold text-green-500 transition-all">${balance.toFixed(2)}</p>
  );
}
