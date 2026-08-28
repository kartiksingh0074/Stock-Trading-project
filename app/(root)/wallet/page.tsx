import Link from "next/link";
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Wallet as WalletIcon, ArrowUpRight, PieChart } from "lucide-react";
import { getUserBalance, getNetWorthHistory } from "@/lib/actions/wallet.actions";
import { getPaymentHistory } from "@/lib/actions/payment.actions";
import { Button } from "@/components/ui/button";
import LiveBalance from "@/components/LiveBalance";
import NetWorthChart from "@/components/NetWorthChart";

export default async function WalletPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/sign-in");
  }

  const [cashBalance, history, payments] = await Promise.all([
    getUserBalance(),
    getNetWorthHistory(),
    getPaymentHistory(),
  ]);

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Wallet</h1>
          <p className="text-gray-500">Your cash balance and net worth over time</p>
        </div>
        <div className="flex gap-3">
          <Link href="/upgrade">
            <Button className="yellow-btn">
              <ArrowUpRight className="h-4 w-4 mr-2" />
              Top Up
            </Button>
          </Link>
          <Link href="/portfolio">
            <Button variant="outline">
              <PieChart className="h-4 w-4 mr-2" />
              View Portfolio
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6 flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm mb-1">Available Cash</p>
          <LiveBalance initialBalance={cashBalance} />
        </div>
        <WalletIcon className="h-10 w-10 text-purple-500" />
      </div>

      <NetWorthChart history={history} />

      <div>
        <h2 className="text-xl font-bold mb-4">Top-Up History</h2>
        {payments.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-6">
            <p className="text-gray-400 text-sm">
              No top-ups yet.{" "}
              <Link href="/upgrade" className="text-yellow-500 hover:underline">
                Upgrade your plan
              </Link>{" "}
              to add virtual trading cash.
            </p>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg divide-y divide-gray-700">
            {payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{payment.planId}</p>
                  <p className="text-sm text-gray-400">{new Date(payment.createdAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">{payment.status}</span>
                  <span className="font-semibold text-green-500">+${payment.creditsGranted.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
