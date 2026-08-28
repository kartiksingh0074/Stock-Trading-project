export interface Plan {
    id: string;
    name: string;
    description: string;
    priceCents: number;
    currency: string;
    // Virtual trading cash credited to the user's cashBalance on successful payment.
    creditAmount: number;
    tier: "PRO";
    // Set this to a real Stripe Price ID (created in the Stripe dashboard/CLI) per plan.
    stripePriceEnvVar: string;
}

export const PLANS: Plan[] = [
    {
        id: "pro-starter",
        name: "Pro Starter",
        description: "A one-time boost to your virtual trading cash.",
        priceCents: 499,
        currency: "usd",
        creditAmount: 25_000,
        tier: "PRO",
        stripePriceEnvVar: "STRIPE_PRICE_PRO_STARTER",
    },
    {
        id: "pro-plus",
        name: "Pro Plus",
        description: "A bigger virtual cash boost for serious paper trading.",
        priceCents: 1499,
        currency: "usd",
        creditAmount: 100_000,
        tier: "PRO",
        stripePriceEnvVar: "STRIPE_PRICE_PRO_PLUS",
    },
];

export function getPlanById(planId: string): Plan | undefined {
    return PLANS.find((plan) => plan.id === planId);
}

export function getStripePriceId(plan: Plan): string {
    const priceId = process.env[plan.stripePriceEnvVar];
    if (!priceId) {
        throw new Error(`${plan.stripePriceEnvVar} is not configured for plan "${plan.id}"`);
    }
    return priceId;
}
