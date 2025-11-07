import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/prisma";
import { nextCookies } from "better-auth/next-js";

let authInstance: ReturnType<typeof betterAuth> | null = null;

export const getAuth = () => {
    if(authInstance) return authInstance;

    authInstance = betterAuth({
        database: prismaAdapter(prisma, {
            provider: "mysql",
        }),
        secret: process.env.BETTER_AUTH_SECRET || "fallback-secret-key-min-32-characters-long",
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
        trustedOrigins: ["http://localhost:3000"],
    });

    return authInstance;
}

export const auth = getAuth();
