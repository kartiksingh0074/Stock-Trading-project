"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createCheckoutSession } from "@/lib/actions/payment.actions";
import type { Plan } from "@/lib/stripe/plans";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";

interface PaymentRecord {
  id: string;
  planId: string;
  status: string;
  creditsGranted: number;
  createdAt: Date;
}

interface UpgradePlansProps {
  plans: Plan[];
  payments: PaymentRecord[];
}

export default function UpgradePlans({ plans, payments }: UpgradePlansProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);

  useEffect(() => {
    const status = searchParams.get("status");
    if (status === "success") {
      toast.success("Payment received! Your balance updates once it's confirmed — refresh in a few seconds if it's not there yet.");
      router.replace("/upgrade");
    } else if (status === "cancelled") {
      toast.info("Checkout cancelled.");
      router.replace("/upgrade");
    }
  }, [searchParams, router]);

  const handleUpgrade = async (planId: string) => {
    setLoadingPlanId(planId);
    try {
      const result = await createCheckoutSession(planId);
      if (result.success && result.url) {
        window.location.href = result.url;
      } else {
        toast.error(result.error || "Failed to start checkout");
        setLoadingPlanId(null);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Failed to start checkout");
      setLoadingPlanId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plans.map((plan) => (
          <div key={plan.id} className="bg-gray-800 rounded-lg p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-bold mb-1">{plan.name}</h2>
              <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
              <p className="text-3xl font-bold mb-2">
                ${(plan.priceCents / 100).toFixed(2)}
                <span className="text-sm font-normal text-gray-400"> one-time</span>
              </p>
              <p className="text-green-500 font-semibold mb-6">
                +${plan.creditAmount.toLocaleString()} virtual trading cash
              </p>
            </div>
            <Button onClick={() => handleUpgrade(plan.id)} disabled={loadingPlanId !== null}>
              {loadingPlanId === plan.id ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redirecting...
                </>
              ) : (
                "Upgrade"
              )}
            </Button>
          </div>
        ))}
      </div>

      {payments.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Payment History</h2>
          <div className="bg-gray-800 rounded-lg divide-y divide-gray-700">
            {payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{payment.planId}</p>
                  <p className="text-sm text-gray-400">
                    {new Date(payment.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {payment.status === "COMPLETED" && (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  )}
                  <span className="text-sm text-gray-400">{payment.status}</span>
                  <span className="font-semibold">+${payment.creditsGranted.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
