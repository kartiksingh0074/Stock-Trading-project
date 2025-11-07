import { prisma } from '@/lib/prisma';

export const connectToDatabase = async () => {
  try {
    await prisma.$connect();
    console.log('Connected to MySQL database');
    return prisma;
  } catch (error) {
    console.error('Error connecting to MySQL database:', error);
    throw error;
  }
};

export const disconnectFromDatabase = async () => {
  try {
    await prisma.$disconnect();
    console.log('Disconnected from MySQL database');
  } catch (error) {
    console.error('Error disconnecting from MySQL database:', error);
    throw error;
  }
};

