'use server';

import { prisma } from '@/lib/prisma';

export const getAllUsersForNewsEmail = async () => {
    try {
        const users = await prisma.user.findMany({
            where: {
                email: { not: null },
                name: { not: null },
            },
            select: {
                id: true,
                email: true,
                name: true,
                country: true,
            },
        });

        return users.filter((user) => user.email && user.name).map((user) => ({
            id: user.id,
            email: user.email!,
            name: user.name!,
            country: user.country || undefined,
        }));
    } catch (e) {
        console.error('Error fetching users for news email:', e);
        return [];
    }
};
