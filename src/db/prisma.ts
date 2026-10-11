import prismaClient from "../../lib/prismaClient.js";

export const prisma = prismaClient;
export type PrismaClientLike = typeof prisma;
