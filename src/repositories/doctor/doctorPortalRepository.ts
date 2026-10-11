import type { Prisma } from "@prisma/client";
import { prisma, type PrismaClientLike } from "../../db/prisma";
import { AppError } from "../../lib/errors/appError";

export interface DoctorPortalRepository {
  listAppointments(doctorId: string): Promise<Array<Record<string, unknown>>>;
  findDoctorProfile(doctorId: string): Promise<{ clinic: string | null } | null>;
  createAppointment(input: {
    doctorId: string;
    patientId: string;
    scheduledAt: Date;
    reason?: string | null;
    location?: string | null;
    type?: string | null;
  }): Promise<Record<string, unknown>>;
  findPatientById(patientId: string): Promise<{ userId: string | null; fullName: string } | null>;
  findDoctorUserName(doctorId: string): Promise<string | null>;
  findAppointmentWithPatient(id: string): Promise<Prisma.AppointmentGetPayload<{ include: { patient: { select: { userId: true; fullName: true } } } }> | null>;
  updateAppointment(id: string, data: Prisma.AppointmentUpdateInput): Promise<Record<string, unknown>>;
  softDeleteAppointment(id: string): Promise<void>;

  listActivePatientsForDoctor(doctorId: string): Promise<Array<Record<string, unknown>>>;
  listDoctorMedicalRecords(input: { doctorId: string; patientId?: string }): Promise<Array<Record<string, unknown>>>;
  findDoctorMedicalRecord(input: { id: string; doctorId: string }): Promise<Prisma.MedicalRecordGetPayload<{ select: { patientId: true; reviewedByDoctor: true; doctorNotes: true; patient: { select: { id: true; userId: true; fullName: true } } } }> | null>;
  updateDoctorMedicalRecord(input: {
    id: string;
    doctorId: string;
    reviewedByDoctor: boolean;
    doctorNotes: string | null;
    clinicalStatus?: "stable" | "critical" | "recovering";
  }): Promise<number>;
  findDoctorMedicalRecordWithRelations(input: { id: string; doctorId: string }): Promise<Record<string, unknown> | null>;

  countUnreadNotifications(userId: string): Promise<number>;
  listNotifications(input: { userId: string; cursor?: string | null; take: number }): Promise<Array<Record<string, unknown>>>;
  findNotificationById(id: string): Promise<{ id: string; userId: string; isRead: boolean } | null>;
  updateNotificationRead(input: { id: string; isRead: boolean }): Promise<Record<string, unknown>>;
  markAllNotificationsRead(userId: string): Promise<number>;
  softDeleteNotificationById(id: string): Promise<void>;
  softDeleteAllNotifications(userId: string): Promise<number>;
  findDoctorProfileByUserId(userId: string): Promise<{
    user: { fullName: string | null; email: string | null } | null;
    doctor: {
      userId: string;
      phone: string | null;
      specialty: string | null;
      bio: string | null;
      licenseNumber: string;
      status: string;
      createdAt: Date;
    } | null;
  }>;
  listDoctorsPublic(includePending: boolean): Promise<Array<Record<string, unknown>>>;
}

export function createDoctorPortalRepository(
  db: PrismaClientLike = prisma,
): DoctorPortalRepository {
  return {
    async listAppointments(doctorId) {
      try {
        const appointments = await db.appointment.findMany({
          where: { doctorId, isDeleted: false },
          include: {
            patient: {
              select: { id: true, fullName: true, email: true, phone: true },
            },
            doctor: {
              select: {
                userId: true,
                phone: true,
                user: { select: { id: true, fullName: true, email: true } },
              },
            },
          },
          orderBy: { scheduledAt: "asc" },
        });
        return appointments as unknown as Array<Record<string, unknown>>;
      } catch (error) {
        throw new AppError({ code: "repository_error", message: "Failed to list doctor appointments", statusCode: 500, cause: error });
      }
    },

    async findDoctorProfile(doctorId) {
      try {
        return await db.doctor.findUnique({ where: { userId: doctorId }, select: { clinic: true } });
      } catch (error) {
        throw new AppError({ code: "repository_error", message: "Failed to find doctor profile", statusCode: 500, cause: error });
      }
    },

    async createAppointment(input) {
      try {
        const created = await db.appointment.create({
          data: {
            doctorId: input.doctorId,
            patientId: input.patientId,
            scheduledAt: input.scheduledAt,
            status: "scheduled",
            reason: input.reason || null,
            location: input.location || null,
            type: input.type || "clinic",
          },
        });
        return created as unknown as Record<string, unknown>;
      } catch (error) {
        throw new AppError({ code: "repository_error", message: "Failed to create appointment", statusCode: 500, cause: error });
      }
    },

    async findPatientById(patientId) {
      try {
        return await db.patient.findUnique({ where: { id: patientId }, select: { userId: true, fullName: true } });
      } catch (error) {
        throw new AppError({ code: "repository_error", message: "Failed to find patient", statusCode: 500, cause: error });
      }
    },

    async findDoctorUserName(doctorId) {
      try {
        const user = await db.user.findUnique({ where: { id: doctorId }, select: { fullName: true } });
        return user?.fullName || null;
      } catch (error) {
        throw new AppError({ code: "repository_error", message: "Failed to find doctor user", statusCode: 500, cause: error });
      }
    },

    async findAppointmentWithPatient(id) {
      try {
        return await db.appointment.findUnique({
          where: { id },
          include: { patient: { select: { userId: true, fullName: true } } },
        });
      } catch (error) {
        throw new AppError({ code: "repository_error", message: "Failed to find appointment", statusCode: 500, cause: error });
      }
    },

    async updateAppointment(id, data) {
      try {
        const updated = await db.appointment.update({ where: { id }, data });
        return updated as unknown as Record<string, unknown>;
      } catch (error) {
        throw new AppError({ code: "repository_error", message: "Failed to update appointment", statusCode: 500, cause: error });
      }
    },

    async softDeleteAppointment(id) {
      try {
        await db.appointment.update({ where: { id }, data: { isDeleted: true } });
      } catch (error) {
        throw new AppError({ code: "repository_error", message: "Failed to delete appointment", statusCode: 500, cause: error });
      }
    },

    async listActivePatientsForDoctor(doctorId) {
      try {
        const patients = await db.patient.findMany({
          where: { status: "active", doctorId },
          include: {
            medicalRecords: {
              where: { doctorId },
              orderBy: { createdAt: "desc" },
              select: { id: true, doctorNotes: true, createdAt: true },
            },
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                createdAt: true,
                isActive: true,
              },
            },
          },
          orderBy: { fullName: "asc" },
        });
        return patients as unknown as Array<Record<string, unknown>>;
      } catch (error) {
        throw new AppError({ code: "repository_error", message: "Failed to list doctor patients", statusCode: 500, cause: error });
      }
    },

    async listDoctorMedicalRecords(input) {
      try {
        const records = await db.medicalRecord.findMany({
          where: { doctorId: input.doctorId, ...(input.patientId ? { patientId: input.patientId } : {}) },
          include: {
            patient: {
              select: {
                id: true,
                fullName: true,
                email: true,
                clinicalStatus: true,
              },
            },
            doctor: {
              select: {
                userId: true,
                user: { select: { id: true, fullName: true, email: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        });
        return records as unknown as Array<Record<string, unknown>>;
      } catch (error) {
        throw new AppError({ code: "repository_error", message: "Failed to list doctor medical records", statusCode: 500, cause: error });
      }
    },

    async findDoctorMedicalRecord(input) {
      try {
        return await db.medicalRecord.findFirst({
          where: { id: input.id, doctorId: input.doctorId },
          select: {
            patientId: true,
            reviewedByDoctor: true,
            doctorNotes: true,
            patient: { select: { id: true, userId: true, fullName: true } },
          },
        });
      } catch (error) {
        throw new AppError({ code: "repository_error", message: "Failed to find doctor medical record", statusCode: 500, cause: error });
      }
    },

    async updateDoctorMedicalRecord(input) {
      try {
        return await db.$transaction(async (tx: Prisma.TransactionClient) => {
          const updated = await tx.medicalRecord.updateMany({
            where: { id: input.id, doctorId: input.doctorId },
            data: {
              reviewedByDoctor: input.reviewedByDoctor,
              doctorNotes: input.doctorNotes,
            },
          });

          if (input.clinicalStatus) {
            const before = await tx.medicalRecord.findFirst({
              where: { id: input.id, doctorId: input.doctorId },
              select: { patient: { select: { id: true } } },
            });
            if (before?.patient?.id) {
              await tx.patient.updateMany({
                where: { id: before.patient.id, doctorId: input.doctorId },
                data: { clinicalStatus: input.clinicalStatus },
              });
            }
          }

          return updated.count;
        });
      } catch (error) {
        throw new AppError({ code: "repository_error", message: "Failed to update doctor medical record", statusCode: 500, cause: error });
      }
    },

    async findDoctorMedicalRecordWithRelations(input) {
      try {
        const record = await db.medicalRecord.findFirst({
          where: { id: input.id, doctorId: input.doctorId },
          include: {
            patient: { select: { id: true, fullName: true, email: true } },
            doctor: {
              select: {
                userId: true,
                user: { select: { id: true, fullName: true, email: true } },
              },
            },
          },
        });

        return record as unknown as Record<string, unknown> | null;
      } catch (error) {
        throw new AppError({ code: "repository_error", message: "Failed to load updated medical record", statusCode: 500, cause: error });
      }
    },

    async countUnreadNotifications(userId) {
      try {
        return await db.notification.count({ where: { userId, isRead: false, isDeleted: false } });
      } catch (error) {
        throw new AppError({ code: "repository_error", message: "Failed to count doctor unread notifications", statusCode: 500, cause: error });
      }
    },

    async listNotifications(input) {
      try {
        const where = { userId: input.userId, isDeleted: false };
        const notifications = input.cursor
          ? await db.notification.findMany({
              where,
              orderBy: { createdAt: "desc" },
              take: input.take + 1,
              cursor: { id: input.cursor },
              skip: 1,
            })
          : await db.notification.findMany({
              where,
              orderBy: { createdAt: "desc" },
              take: input.take + 1,
            });

        return notifications as unknown as Array<Record<string, unknown>>;
      } catch (error) {
        throw new AppError({ code: "repository_error", message: "Failed to list doctor notifications", statusCode: 500, cause: error });
      }
    },

    async findNotificationById(id) {
      try {
        return await db.notification.findUnique({
          where: { id },
          select: { id: true, userId: true, isRead: true },
        });
      } catch (error) {
        throw new AppError({ code: "repository_error", message: "Failed to find notification", statusCode: 500, cause: error });
      }
    },

    async updateNotificationRead(input) {
      try {
        const updated = await db.notification.update({
          where: { id: input.id },
          data: { isRead: input.isRead, readAt: input.isRead ? new Date() : null },
        });
        return updated as unknown as Record<string, unknown>;
      } catch (error) {
        throw new AppError({ code: "repository_error", message: "Failed to update notification", statusCode: 500, cause: error });
      }
    },

    async markAllNotificationsRead(userId) {
      try {
        const result = await db.notification.updateMany({
          where: { userId, isDeleted: false, isRead: false },
          data: { isRead: true, readAt: new Date() },
        });
        return result.count;
      } catch (error) {
        throw new AppError({ code: "repository_error", message: "Failed to mark doctor notifications read", statusCode: 500, cause: error });
      }
    },

    async softDeleteNotificationById(id) {
      try {
        await db.notification.update({ where: { id }, data: { isDeleted: true, archivedAt: new Date() } });
      } catch (error) {
        throw new AppError({ code: "repository_error", message: "Failed to delete doctor notification", statusCode: 500, cause: error });
      }
    },

    async softDeleteAllNotifications(userId) {
      try {
        const result = await db.notification.updateMany({
          where: { userId, isDeleted: false },
          data: { isDeleted: true, archivedAt: new Date() },
        });
        return result.count;
      } catch (error) {
        throw new AppError({ code: "repository_error", message: "Failed to delete doctor notifications", statusCode: 500, cause: error });
      }
    },

    async findDoctorProfileByUserId(userId) {
      try {
        const [user, doctor] = await Promise.all([
          db.user.findUnique({
            where: { id: userId },
            select: { fullName: true, email: true },
          }),
          db.doctor.findFirst({
            where: { userId },
            select: {
              userId: true,
              phone: true,
              specialty: true,
              bio: true,
              licenseNumber: true,
              status: true,
              createdAt: true,
            },
          }),
        ]);

        return {
          user: user
            ? { fullName: user.fullName || null, email: user.email || null }
            : null,
          doctor: doctor
            ? {
                userId: doctor.userId,
                phone: doctor.phone || null,
                specialty: doctor.specialty || null,
                bio: doctor.bio || null,
                licenseNumber: doctor.licenseNumber,
                status: doctor.status,
                createdAt: doctor.createdAt,
              }
            : null,
        };
      } catch (error) {
        throw new AppError({ code: "repository_error", message: "Failed to load doctor profile", statusCode: 500, cause: error });
      }
    },

    async listDoctorsPublic(includePending) {
      try {
        const whereClause = includePending
          ? { status: { in: ["active", "pending"] as const } }
          : { status: "active" as const };

        const doctors = await db.doctor.findMany({
          where: whereClause,
          include: {
            user: {
              select: { id: true, fullName: true, email: true },
            },
          },
        });

        return doctors.map((doctor: (typeof doctors)[number]) => ({
          id: doctor.userId,
          fullName: doctor.user?.fullName,
          email: doctor.user?.email,
        }));
      } catch (error) {
        throw new AppError({ code: "repository_error", message: "Failed to list doctors", statusCode: 500, cause: error });
      }
    },
  };
}
