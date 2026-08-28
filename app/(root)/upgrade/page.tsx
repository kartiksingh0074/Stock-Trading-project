import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getUserPlanInfo, getPaymentHistory } from "@/lib/actions/payment.actions";
import { PLANS } from "@/lib/stripe/plans";
import UpgradePlans from "@/components/UpgradePlans";

export default async function UpgradePage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/sign-in");
  }

  const [planInfo, payments] = await Promise.all([getUserPlanInfo(), getPaymentHistory()]);

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Upgrade Plan</h1>
        <p className="text-gray-500">
          Get more virtual trading cash. Current plan:{" "}
          <span className="font-semibold text-yellow-500">{planInfo.tier}</span> · Cash balance: $
          {planInfo.cashBalance.toFixed(2)}
        </p>
      </div>

      <UpgradePlans plans={PLANS} payments={payments} />
    </div>
  );
}
