import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";

export async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED");
  }

  return session;
}

export async function requireUserId() {
  const session = await requireSession();
  return session.user.id;
}
