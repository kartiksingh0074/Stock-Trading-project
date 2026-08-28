import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";
import { nextCookies } from "better-auth/next-js";

let authInstance: ReturnType<typeof betterAuth> | null = null;

function getSecret(): string {
    const secret = process.env.BETTER_AUTH_SECRET;
    if (!secret) {
        throw new Error(
            "BETTER_AUTH_SECRET is not set. Refusing to start with an insecure default — set it in your environment (see .env.example)."
        );
    }
    return secret;
}

function getTrustedOrigins(): string[] {
    const raw = process.env.TRUSTED_ORIGINS || process.env.BETTER_AUTH_URL || "http://localhost:3000";
    return raw.split(",").map((origin) => origin.trim()).filter(Boolean);
}

export const getAuth = () => {
    if(authInstance) return authInstance;

    authInstance = betterAuth({
        database: prismaAdapter(prisma, {
            provider: "mysql",
        }),
        secret: getSecret(),
        baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
        emailAndPassword: {
            enabled: true,
            disableSignUp: false,
            requireEmailVerification: false,
            minPasswordLength: 8,
            maxPasswordLength: 128,
            autoSignIn: true,
        },
        plugins: [nextCookies()],
        trustedOrigins: getTrustedOrigins(),
    });

    return authInstance;
}

export const auth = getAuth();
