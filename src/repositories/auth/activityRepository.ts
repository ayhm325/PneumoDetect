import { prisma, type PrismaClientLike } from "../../db/prisma";

export interface AuthActivityRepository {
  createLoginActivity(input: {
    userId: string;
    fullName: string;
    email: string;
    role: string;
    ip: string | null;
  }): Promise<void>;
  createDoctorRegistrationActivity(input: {
    userId: string;
    fullName: string;
    email: string;
    licenseNumber: string;
    phone: string;
  }): Promise<void>;
}

export function createAuthActivityRepository(
  db: PrismaClientLike = prisma,
): AuthActivityRepository {
  return {
    async createLoginActivity(input) {
      try {
        await db.activity.create({
          data: {
            type: "login",
            description: `تسجيل دخول: ${input.fullName} (${input.email})`,
            userId: input.userId,
            meta: {
              fullName: input.fullName,
              email: input.email,
              role: input.role,
              ip: input.ip,
            },
          },
        });
      } catch (error) {
        console.error("AuthActivityRepository.createLoginActivity", error);
      }
    },

    async createDoctorRegistrationActivity(input) {
      try {
        await db.activity.create({
          data: {
            type: "add_doctor",
            description: `إضافة طبيب جديد: ${input.fullName} (${input.email})`,
            userId: input.userId,
            meta: {
              licenseNumber: input.licenseNumber,
              phone: input.phone,
            },
          },
        });
      } catch (error) {
        console.error(
          "AuthActivityRepository.createDoctorRegistrationActivity",
          error,
        );
      }
    },
  };
}
