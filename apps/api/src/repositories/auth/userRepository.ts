import { prisma, type PrismaClientLike } from "../../db/prisma";
import { AppError } from "../../lib/errors/appError";
import type { Prisma } from "@prisma/client";

export type UserWithDoctor = Prisma.UserGetPayload<{
  include: { doctor: true };
}> & {
  isDeleted?: boolean;
};

export interface AuthUserRepository {
  findByEmailWithDoctor(email: string): Promise<UserWithDoctor | null>;
  findByEmail(email: string): Promise<{ id: string } | null>;
  createPatientUser(input: {
    email: string;
    hashedPassword: string;
    fullName: string;
    phone?: string | null;
    doctorId?: string | null;
  }): Promise<{ id: string; email: string; fullName: string; patient: { id: string } }>;
}

const DEV_FALLBACK_USERS: Record<string, UserWithDoctor> = {
  "admin@example.com": {
    id: "620d6480-cf8c-47cf-aff5-894fe29f18e9",
    email: "admin@example.com",
    password: "$2b$10$q1DSrNbX7.VU3kcgAd0mdurqokrycmTrcXtuMHf77mbcgRVb95rcO",
    fullName: "Admin User",
    role: "admin",
    isActive: true,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    doctor: null,
  },
  "doctor@example.com": {
    id: "5810730d-61bb-4107-add2-950458abfc46",
    email: "doctor@example.com",
    password: "$2b$10$q1DSrNbX7.VU3kcgAd0mdurqokrycmTrcXtuMHf77mbcgRVb95rcO",
    fullName: "Dr. John Doe",
    role: "doctor",
    isActive: true,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    doctor: {
      userId: "5810730d-61bb-4107-add2-950458abfc46",
      phone: "0500000001",
      licenseNumber: "LIC-12345",
      clinic: null,
      status: "active",
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-01"),
    },
  },
  "patient@example.com": {
    id: "b34cf6ff-ff28-48b9-9ea9-092c7b7de0f5",
    email: "patient@example.com",
    password: "$2b$10$q1DSrNbX7.VU3kcgAd0mdurqokrycmTrcXtuMHf77mbcgRVb95rcO",
    fullName: "Patient One",
    role: "patient",
    isActive: true,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    doctor: null,
  },
};

export function createAuthUserRepository(db: PrismaClientLike = prisma): AuthUserRepository {
  return {
    async findByEmailWithDoctor(email) {
      try {
        return await db.user.findUnique({
          where: { email },
          include: { doctor: true },
        });
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          const fallback = DEV_FALLBACK_USERS[email.toLowerCase().trim()];
          if (fallback) {
            console.warn(
              `[userRepository] Database unavailable, using fallback dev user for ${email}`,
            );
            return fallback;
          }
        }
        console.error("[userRepository] Failed to load user from database:", error);
        throw new AppError({
          code: "repository_error",
          message: "Failed to load user",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async findByEmail(email) {
      try {
        return await db.user.findUnique({ where: { email }, select: { id: true } });
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to check user existence",
          statusCode: 500,
          cause: error,
        });
      }
    },

    async createPatientUser(input) {
      try {
        return await db.user.create({
          data: {
            email: input.email,
            password: input.hashedPassword,
            fullName: input.fullName,
            role: "patient",
            isActive: true,
            patient: {
              create: {
                fullName: input.fullName,
                email: input.email,
                phone: input.phone || null,
                doctorId: input.doctorId || null,
              },
            },
          },
          include: { patient: true },
        });
      } catch (error) {
        throw new AppError({
          code: "repository_error",
          message: "Failed to create patient user",
          statusCode: 500,
          cause: error,
        });
      }
    },
  };
}
