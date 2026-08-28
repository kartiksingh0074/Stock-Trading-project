import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTransactions } from "@/lib/actions/transaction.actions";
import OrderHistoryPanel from "@/components/OrderHistoryPanel";

export default async function OrdersPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/sign-in");
  }

  const transactions = await getTransactions(200);

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Order History</h1>
        <p className="text-gray-500">Every buy and sell you&apos;ve executed</p>
      </div>

      <OrderHistoryPanel transactions={transactions} />
    </div>
  );
}
