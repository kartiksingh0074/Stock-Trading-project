'use server';

import {auth} from "@/lib/better-auth/auth";
import {headers} from "next/headers";
import {Decimal} from "@prisma/client/runtime/library";
import {seedInitialSnapshot} from "@/lib/actions/snapshot.actions";

export const signUpWithEmail = async ({ email, password, fullName, country }: SignUpFormData) => {
    try {
        const response = await auth.api.signUpEmail({ body: { email, password, name: fullName } })

        if (response?.user?.id) {
            await seedInitialSnapshot(response.user.id, new Decimal('10000.00'));
        }

        return { success: true, data: response }
    } catch (e) {
        console.log('Sign up failed', e)
        return { success: false, error: 'Sign up failed' }
    }
}

export const signInWithEmail = async ({ email, password }: SignInFormData) => {
    try {
        const response = await auth.api.signInEmail({ body: { email, password } })

        return { success: true, data: response }
    } catch (e) {
        console.log('Sign in failed', e)
        return { success: false, error: 'Sign in failed' }
    }
}

export const signOut = async () => {
    try {
        await auth.api.signOut({ headers: await headers() });
    } catch (e) {
        console.log('Sign out failed', e)
        return { success: false, error: 'Sign out failed' }
    }
}
