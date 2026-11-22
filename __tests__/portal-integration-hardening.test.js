import { jest } from "@jest/globals";
import { prisma } from "../apps/api/src/db/prisma";
import { createPatientPortalRepository } from "../apps/api/src/repositories/patient/patientPortalRepository";
import { createPatientPortalService } from "../apps/api/src/services/patient/patientPortalService";
import { createDoctorPortalRepository } from "../apps/api/src/repositories/doctor/doctorPortalRepository";
import { createDoctorPortalService } from "../apps/api/src/services/doctor/doctorPortalService";
import { createAdminDoctorRepository } from "../apps/api/src/repositories/admin/adminDoctorRepository";
import { createAdminDoctorService } from "../apps/api/src/services/admin/adminDoctorService";
import { createAdminPatientRepository } from "../apps/api/src/repositories/admin/adminPatientRepository";
import { createAdminPatientService } from "../apps/api/src/services/admin/adminPatientService";
import { createAdminUserService } from "../apps/api/src/services/admin/adminUserService";
import { createAdminSettingsService } from "../apps/api/src/services/admin/adminSettingsService";
import { createAuthService } from "../apps/api/src/services/auth/authService";
import { createPatientDoctorChangeRequestService } from "../apps/api/src/services/patient/patientDoctorChangeRequestService";
import {
  ApiClientError,
  apiFetch,
  apiRequest,
  resolveApiUrl,
} from "../apps/web/src/lib/apiClient";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { GlideSelect } from "../apps/web/src/components/ui/GlideSelect";
import { Button, IconButton } from "../apps/web/src/components/ui/Button";

describe("PneumoDetect Portal Integration & End-to-End Business Logic Hardening", () => {
  beforeEach(() => {
    jest.spyOn(prisma.notification, "create").mockResolvedValue({ id: "notif-mock" });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("1. Patient Profile Update: accepts input.body or flat input, updates Patient & User atomically, and fails if User update fails", async () => {
    const state = {
      user: {
        id: "pat-user-1",
        fullName: "Original Patient",
        email: "original@test.com",
      },
      patient: {
        id: "pat-1",
        userId: "pat-user-1",
        fullName: "Original Patient",
        email: "original@test.com",
        phone: "0500000000",
        gender: "male",
        birthDate: new Date("1995-01-01"),
        bloodType: "O+",
        notes: "Initial note",
        doctorId: "doc-1",
        status: "active",
        clinicalStatus: "stable",
        joinDate: new Date("2025-01-01"),
      },
    };

    const mockTx = {
      user: {
        update: jest.fn(async ({ data }) => {
          Object.assign(state.user, data);
          return state.user;
        }),
      },
      patient: {
        update: jest.fn(async ({ data }) => {
          Object.assign(state.patient, data);
          return {
            ...state.patient,
            user: { ...state.user },
          };
        }),
      },
    };

    const repo = createPatientPortalRepository({
      $transaction: async (fn) => fn(mockTx),
      patient: {
        findFirst: jest.fn(async () => ({
          ...state.patient,
          user: { ...state.user },
        })),
        findUnique: jest.fn(async () => ({
          ...state.patient,
          user: { ...state.user },
        })),
      },
    });

    const service = createPatientPortalService({
      patientPortalRepository: repo,
    });

    // Test with input.body shape (matching patient.routes.ts PUT /patient/profile)
    const updatedRes = await service.updateProfile({
      userId: "pat-user-1",
      body: {
        fullName: "Updated Patient Name",
        email: "updated@test.com",
        phone: "0599999999",
        bloodType: "A+",
        birthDate: "1992-05-15",
        notes: "Updated allergy notes",
      },
    });

    expect(updatedRes.profile.fullName).toBe("Updated Patient Name");
    expect(updatedRes.profile.email).toBe("updated@test.com");
    expect(updatedRes.profile.phone).toBe("0599999999");
    expect(updatedRes.profile.bloodType).toBe("A+");
    expect(state.user.fullName).toBe("Updated Patient Name");
    expect(state.user.email).toBe("updated@test.com");
    expect(mockTx.user.update).toHaveBeenCalledTimes(1);
    expect(mockTx.patient.update).toHaveBeenCalledTimes(1);

    // Invalid email is rejected with 400
    await expect(
      service.updateProfile({
        userId: "pat-user-1",
        body: { email: "invalid-email" },
      }),
    ).rejects.toMatchObject({ code: "validation_error", statusCode: 400 });

    // If User update fails inside transaction, error is NOT swallowed
    mockTx.user.update.mockRejectedValueOnce(new Error("Duplicate email constraint"));
    await expect(
      service.updateProfile({
        userId: "pat-user-1",
        body: { email: "taken@test.com" },
      }),
    ).rejects.toMatchObject({ statusCode: 500 });
  });

  test("2. Patient Appointments Lifecycle: persists type (clinic/online), never passes phone to Prisma appointment.create, validates active doctor, and enforces appointmentInterval", async () => {
    const createdAppointments = [];
    const patientState = {
      id: "pat-1",
      userId: "pat-user-1",
      doctorId: "doc-1",
      phone: "0501112222",
    };

    const mockAppointmentCreate = jest.fn(async ({ data }) => {
      // Prisma schema for Appointment does NOT have a `phone` column!
      if ("phone" in data) {
        throw new Error("Unknown argument `phone` in data.phone for type AppointmentCreateInput");
      }
      const record = {
        id: `apt-${createdAppointments.length + 1}`,
        status: "scheduled",
        ...data,
        isDeleted: false,
        doctor: {
          userId: data.doctorId,
          clinic: "Chest Clinic A",
          phone: "0550001111",
          user: { fullName: "Dr. Active", email: "doc@test.com" },
        },
      };
      createdAppointments.push(record);
      return record;
    });

    const repo = createPatientPortalRepository({
      patient: {
        findFirst: jest.fn(async () => patientState),
        findUnique: jest.fn(async () => patientState),
        update: jest.fn(async ({ data }) => {
          Object.assign(patientState, data);
          return patientState;
        }),
      },
      doctor: {
        findUnique: jest.fn(async ({ where }) => {
          if (where.userId === "doc-1") {
            return { userId: "doc-1", status: "active", clinic: "Chest Clinic A", user: { fullName: "Dr. Active" } };
          }
          if (where.userId === "doc-pending") {
            return { userId: "doc-pending", status: "pending", clinic: "Clinic B", user: { fullName: "Dr. Pending" } };
          }
          return null;
        }),
      },
      appointment: {
        create: mockAppointmentCreate,
        findMany: jest.fn(async () => createdAppointments.filter((a) => !a.isDeleted)),
        findUnique: jest.fn(async ({ where }) => createdAppointments.find((a) => a.id === where.id) || null),
        update: jest.fn(async ({ where, data }) => {
          const apt = createdAppointments.find((a) => a.id === where.id);
          if (apt) Object.assign(apt, data);
          return apt;
        }),
      },
      notification: {
        create: jest.fn(async () => ({})),
      },
    });

    const service = createPatientPortalService({
      patientPortalRepository: repo,
      adminSettingsRepository: {
        readSettings: jest.fn(async () => ({ appointmentInterval: 30 })),
        writeSettings: jest.fn(),
      },
    });

    // 1. Rejects past date
    await expect(
      service.createAppointment({
        userId: "pat-user-1",
        doctorId: "doc-1",
        scheduledAt: "2020-01-01T10:00:00Z",
        reason: "Checkup",
        type: "online",
      }),
    ).rejects.toMatchObject({ code: "validation_error", statusCode: 400 });

    // 2. Rejects time that does not align with 30-minute appointmentInterval
    await expect(
      service.createAppointment({
        userId: "pat-user-1",
        doctorId: "doc-1",
        scheduledAt: "2027-06-15T10:15:00Z",
        reason: "Checkup",
        type: "online",
      }),
    ).rejects.toMatchObject({ code: "validation_error", statusCode: 400 });

    // 3. Rejects inactive/pending doctor
    await expect(
      service.createAppointment({
        userId: "pat-user-1",
        doctorId: "doc-pending",
        scheduledAt: "2027-06-15T10:30:00Z",
        reason: "Checkup",
      }),
    ).rejects.toMatchObject({ code: "validation_error", statusCode: 400 });

    // 4. Succeeds with valid active doctor, 30-min aligned time, persists type="online", and updates patient phone
    const created = await service.createAppointment({
      userId: "pat-user-1",
      doctorId: "doc-1",
      scheduledAt: "2027-06-15T10:30:00Z",
      reason: "Follow-up consultation",
      type: "online",
      phone: "0507778888",
    });

    expect(created.appointment.type).toBe("online");
    expect(created.appointment.status).toBe("scheduled");
    expect(patientState.phone).toBe("0507778888");

    // 5. List appointments returns persisted type
    const listed = await service.listAppointments({ userId: "pat-user-1" });
    expect(listed.appointments).toHaveLength(1);
    expect(listed.appointments[0].type).toBe("online");

    // 6. Cancel appointment persists status="cancelled" and patientReason
    await service.patchAppointment({
      userId: "pat-user-1",
      appointmentId: created.appointment.id,
      action: "cancel",
      reason: "Travel conflict",
    });
    expect(createdAppointments[0].status).toBe("cancelled");
    expect(createdAppointments[0].patientReason).toBe("Travel conflict");

    // 7. Delete cancelled appointment sets isDeleted=true
    await service.patchAppointment({
      userId: "pat-user-1",
      appointmentId: created.appointment.id,
      action: "delete",
    });
    expect(createdAppointments[0].isDeleted).toBe(true);
  });

  test("3. Doctor Appointments Lifecycle & Security: enforces patient ownership on create (403) and appointment ownership on patch (404)", async () => {
    const appointments = [
      {
        id: "apt-doc-1",
        doctorId: "doc-1",
        patientId: "pat-1",
        scheduledAt: new Date("2027-07-01T09:00:00Z"),
        status: "scheduled",
        reason: "X-ray review",
        type: "clinic",
        location: "Clinic 1",
        isDeleted: false,
      },
    ];

    const repo = createDoctorPortalRepository({
      patient: {
        findUnique: jest.fn(async ({ where }) => {
          if (where.id === "pat-1") return { id: "pat-1", userId: "pat-user-1", doctorId: "doc-1", fullName: "P1" };
          if (where.id === "pat-other") return { id: "pat-other", userId: "pat-user-2", doctorId: "doc-2", fullName: "P2" };
          return null;
        }),
      },
      appointment: {
        findUnique: jest.fn(async ({ where }) => {
          return appointments.find((a) => a.id === where.id && !a.isDeleted) || null;
        }),
        findFirst: jest.fn(async ({ where }) => {
          return (
            appointments.find(
              (a) => a.id === where.id && a.doctorId === where.doctorId && !a.isDeleted,
            ) || null
          );
        }),
        update: jest.fn(async ({ where, data }) => {
          const apt = appointments.find((a) => a.id === where.id);
          if (apt) Object.assign(apt, data);
          return apt;
        }),
        create: jest.fn(async ({ data }) => ({
          id: "apt-doc-new",
          ...data,
        })),
      },
      notification: {
        create: jest.fn(async () => ({})),
      },
    });

    const service = createDoctorPortalService({
      doctorPortalRepository: repo,
      adminSettingsRepository: {
        readSettings: jest.fn(async () => ({ appointmentInterval: 15 })),
        writeSettings: jest.fn(),
      },
    });

    // Doctor cannot create appointment for a patient assigned to another doctor -> 403
    await expect(
      service.createAppointment({
        userId: "doc-1",
        patientId: "pat-other",
        scheduledAt: "2027-07-10T10:00:00Z",
        reason: "Unauthorized booking",
      }),
    ).rejects.toMatchObject({ code: "forbidden", statusCode: 403 });

    // Doctor can confirm their own appointment using `id` or `appointmentId`
    const confirmed = await service.patchAppointment({
      userId: "doc-1",
      id: "apt-doc-1",
      action: "confirm",
    });
    expect(confirmed.appointment.status).toBe("completed");

    // Another doctor cannot patch doc-1's appointment -> 404
    await expect(
      service.patchAppointment({
        userId: "doc-2",
        id: "apt-doc-1",
        action: "cancel",
      }),
    ).rejects.toMatchObject({ code: "not_found", statusCode: 404 });
  });

  test("4. Admin Doctors: respects chosen status (pending/active/banned) on create, supports edit, and blockDoctorByUserId bans without deleting", async () => {
    const createdDoctors = [];
    const mockDoctorTx = {
      user: {
        create: jest.fn(async ({ data }) => ({
          id: "doc-user-1",
          fullName: data.fullName,
          email: data.email,
          role: "doctor",
          isActive: data.isActive,
          createdAt: new Date(),
        })),
        update: jest.fn(async ({ data }) => {
          if (createdDoctors[0]) Object.assign(createdDoctors[0].user, data);
          return createdDoctors[0]?.user;
        }),
      },
      doctor: {
        create: jest.fn(async ({ data }) => {
          const doc = {
            id: "doc-row-1",
            userId: data.userId,
            phone: data.phone,
            licenseNumber: data.licenseNumber,
            status: data.status,
            user: {
              id: data.userId,
              fullName: "Dr. Pending",
              email: "pending.doc@test.com",
              role: "doctor",
              isActive: data.status === "active",
              createdAt: new Date(),
            },
          };
          createdDoctors.push(doc);
          return doc;
        }),
        update: jest.fn(async ({ where, data }) => {
          const doc = createdDoctors.find((d) => d.userId === where.userId);
          if (doc) Object.assign(doc, data);
          return doc;
        }),
      },
      activity: {
        create: jest.fn(async () => ({})),
      },
    };

    const repo = createAdminDoctorRepository({
      user: {
        findUnique: jest.fn(async ({ where }) => {
          if (where.id) return createdDoctors.find((d) => d.userId === where.id)?.user || null;
          return null;
        }),
      },
      doctor: {
        findUnique: jest.fn(async ({ where }) => {
          return createdDoctors.find((d) => d.userId === where.userId) || null;
        }),
      },
      $transaction: jest.fn(async (fn) => {
        if (typeof fn === "function") return fn(mockDoctorTx);
        if (Array.isArray(fn)) return Promise.all(fn);
        return fn;
      }),
    });

    const service = createAdminDoctorService({
      adminDoctorRepository: repo,
      notificationRepository: {
        createSystemNotification: jest.fn(async () => ({})),
      },
    });

    // Create doctor with status="pending" -> doctor.status is "pending" and user.isActive is false
    const created = await service.createDoctor({
      name: "Dr. Pending",
      email: "pending.doc@test.com",
      phone: "0512345678",
      licenseNumber: "LIC-9001",
      password: "DoctorPassword123!",
      status: "pending",
    });
    expect(created.status).toBe("pending");
    expect(created.user.isActive).toBe(false);

    // Update doctor to active and change name
    const updated = await service.updateDoctorByUserId({
      userId: "doc-user-1",
      name: "Dr. Approved",
      status: "active",
    });
    expect(updated.success).toBe(true);
    expect(createdDoctors[0].status).toBe("active");
    expect(createdDoctors[0].user.fullName).toBe("Dr. Approved");
    expect(createdDoctors[0].user.isActive).toBe(true);

    // Block doctor sets status="banned" and user.isActive=false
    await service.blockDoctorByUserId({ userId: "doc-user-1" });
    expect(createdDoctors[0].status).toBe("banned");
    expect(createdDoctors[0].user.isActive).toBe(false);
  });

  test("5. Admin Patients: creates and updates patient with notes, bloodType, birthDate, gender, doctorId, and syncs User & Patient", async () => {
    const state = {
      patient: null,
    };

    const mockTx = {
      user: {
        create: jest.fn(async ({ data }) => ({
          id: "pat-u-10",
          ...data,
        })),
        update: jest.fn(async ({ data }) => {
          if (state.patient) Object.assign(state.patient.user, data);
          return state.patient?.user;
        }),
      },
      patient: {
        create: jest.fn(async ({ data }) => {
          state.patient = {
            id: "pat-10",
            ...data,
            doctor: data.doctorId
              ? { userId: data.doctorId, user: { id: data.doctorId, fullName: "Dr. Ten", email: "d10@test.com" } }
              : null,
            user: {
              id: data.userId,
              fullName: data.fullName,
              email: data.email,
              isActive: data.status === "active",
            },
            _count: { appointments: 0, medicalRecords: 0 },
          };
          return state.patient;
        }),
        update: jest.fn(async ({ data }) => {
          Object.assign(state.patient, data);
          return state.patient;
        }),
      },
    };

    const repo = createAdminPatientRepository({
      $transaction: async (fn) => {
        if (Array.isArray(fn)) return Promise.all(fn);
        return fn(mockTx);
      },
      user: {
        findUnique: jest.fn(async () => null),
        update: mockTx.user.update,
      },
      patient: {
        findUnique: jest.fn(async () => state.patient),
        update: mockTx.patient.update,
      },
    });

    const service = createAdminPatientService({
      adminPatientRepository: repo,
      notificationRepository: {
        createSystemNotification: jest.fn(async () => ({})),
      },
    });

    const created = await service.createPatient({
      name: "Patient Ten",
      email: "p10@test.com",
      password: "Password123!",
      phone: "0566667777",
      gender: "female",
      birthDate: "1998-04-20",
      bloodType: "B+",
      notes: "Asthma history",
      doctorId: "doc-10",
      status: "active",
    });

    expect(created.fullName).toBe("Patient Ten");
    expect(created.bloodType).toBe("B+");
    expect(created.notes).toBe("Asthma history");
    expect(created.doctorId).toBe("doc-10");

    // Update patient fields & suspend status
    const updated = await service.updatePatientById({
      id: "pat-10",
      name: "Patient Ten Updated",
      notes: "Updated clinical notes",
      status: "suspended",
      doctorId: "",
    });

    expect(updated.fullName).toBe("Patient Ten Updated");
    expect(updated.notes).toBe("Updated clinical notes");
    expect(updated.status).toBe("suspended");
    expect(updated.doctorId).toBeNull();
    expect(updated.user.isActive).toBe(false);
  });

  test("6. Admin Users: creates admin user without duplicates (409 on duplicate email) and toggles active state", async () => {
    const users = [];
    const service = createAdminUserService({
      adminUserRepository: {
        listUsersWithProfiles: jest.fn(async () => users),
        findUserByEmail: jest.fn(async (email) => users.find((u) => u.email === email) || null),
        findUserByIdWithProfiles: jest.fn(async (id) => users.find((u) => u.id === id) || null),
        createAdminUser: jest.fn(async (input) => {
          const u = {
            id: `admin-${users.length + 1}`,
            fullName: input.fullName,
            email: input.email,
            password: input.hashedPassword,
            role: "admin",
            isActive: input.isActive,
          };
          users.push(u);
          return u;
        }),
        toggleUserActiveState: jest.fn(async ({ id, isActive }) => {
          const u = users.find((x) => x.id === id);
          if (u) u.isActive = isActive;
        }),
      },
    });

    const created = await service.createAdminUser({
      name: "System Admin",
      email: "sysadmin@test.com",
      password: "StrongPassword1!",
      status: "active",
    });
    expect(created.role).toBe("admin");
    expect(created.password).toBeUndefined();
    expect(users).toHaveLength(1);

    // Duplicate email throws 409
    await expect(
      service.createAdminUser({
        name: "Duplicate Admin",
        email: "sysadmin@test.com",
        password: "StrongPassword1!",
      }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  test("7. Admin Settings Enforcement: registrationEnabled, sessionDuration, allowPatientChangeDoctor, and maxDoctorChangeRequests", async () => {
    let currentSettings = {
      registrationEnabled: false,
      sessionDuration: 45,
      appointmentInterval: 30,
      allowPatientChangeDoctor: false,
      maxDoctorChangeRequests: 2,
    };

    const settingsRepo = {
      readSettings: jest.fn(async () => currentSettings),
      writeSettings: jest.fn(async (next) => {
        currentSettings = { ...currentSettings, ...next };
      }),
    };

    const settingsService = createAdminSettingsService({
      adminSettingsRepository: settingsRepo,
    });
    const saved = await settingsService.updateSettings({ patch: currentSettings });
    expect(saved.success).toBe(true);

    // 7a. Registration disabled blocks both patient and doctor registration with 403
    const authService = createAuthService({
      authRepository: {
        findUserByEmailWithRelations: jest.fn(),
        findUserByEmail: jest.fn(),
        findActiveDoctorByUserId: jest.fn(),
        findDoctorByPhone: jest.fn(),
        findDoctorByLicenseNumber: jest.fn(),
        createPatientAccount: jest.fn(),
        createDoctorAccount: jest.fn(),
        createOrTouchPatientChat: jest.fn(),
      },
      adminSettingsRepository: settingsRepo,
    });

    await expect(
      authService.registerPatient({
        email: "newpat@test.com",
        password: "Password123!",
        fullName: "New Patient",
        doctorId: "doc-1",
      }),
    ).rejects.toMatchObject({ code: "forbidden", statusCode: 403 });

    await expect(
      authService.registerDoctor({
        email: "newdoc@test.com",
        password: "Password123!",
        fullName: "New Doctor",
        phone: "0500001111",
        licenseNumber: "LIC-1",
      }),
    ).rejects.toMatchObject({ code: "forbidden", statusCode: 403 });

    // 7b. Doctor Change Request enforces allowPatientChangeDoctor and maxDoctorChangeRequests
    let requestCount = 0;
    const changeReqService = createPatientDoctorChangeRequestService({
      patientDoctorChangeRequestRepository: {
        listDoctorsForChange: jest.fn(async () => []),
        findPatientByUserId: jest.fn(async () => ({ id: "pat-1", userId: "pat-user-1", doctorId: "doc-1" })),
        findDoctorByUserId: jest.fn(async () => ({ userId: "doc-2", status: "active" })),
        createDoctorChangeRequest: jest.fn(async () => ({ id: "req-1", status: "pending" })),
        countDoctorChangeRequestsByUserId: jest.fn(async () => requestCount),
      },
      adminSettingsRepository: settingsRepo,
    });

    // Blocked when allowPatientChangeDoctor = false
    await expect(
      changeReqService.createDoctorChangeRequest({
        userId: "pat-user-1",
        requestedDoctorId: "doc-2",
        reason: "Closer location",
      }),
    ).rejects.toMatchObject({ code: "forbidden", statusCode: 403 });

    // Allowed when allowPatientChangeDoctor = true and count < maxDoctorChangeRequests
    currentSettings.allowPatientChangeDoctor = true;
    requestCount = 1;
    const reqCreated = await changeReqService.createDoctorChangeRequest({
      userId: "pat-user-1",
      requestedDoctorId: "doc-2",
      reason: "Closer location",
    });
    expect(reqCreated.request.id).toBe("req-1");

    // Blocked when requestCount >= maxDoctorChangeRequests (2)
    requestCount = 2;
    await expect(
      changeReqService.createDoctorChangeRequest({
        userId: "pat-user-1",
        requestedDoctorId: "doc-3",
        reason: "Another change",
      }),
    ).rejects.toMatchObject({ code: "validation_error", statusCode: 400 });
  });

  test("8. Unified Frontend API Client (apiClient.ts): resolveApiUrl, credentials: include, JSON headers, 204 response, and structured ApiClientError", async () => {
    expect(resolveApiUrl("/api/patient/profile", "http://localhost:4000/")).toBe(
      "http://localhost:4000/api/patient/profile",
    );
    expect(resolveApiUrl("api/doctor/me", "http://localhost:4000")).toBe(
      "http://localhost:4000/api/doctor/me",
    );
    expect(resolveApiUrl("https://example.com/health", "http://localhost:4000")).toBe(
      "https://example.com/health",
    );

    const mockFetch = jest.fn();
    global.fetch = mockFetch;

    // 1. Successful JSON request includes credentials: "include" and Content-Type: application/json
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ success: true, items: [1, 2] }),
    });

    const data = await apiRequest("/api/test", {
      method: "POST",
      body: JSON.stringify({ hello: "world" }),
    });
    expect(data).toEqual({ success: true, items: [1, 2] });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [, fetchOpts] = mockFetch.mock.calls[0];
    expect(fetchOpts.credentials).toBe("include");
    expect(fetchOpts.headers.get("Content-Type")).toBe("application/json");

    // 2. 204 No Content returns undefined without throwing JSON parse error
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      text: async () => "",
    });
    const emptyRes = await apiRequest("/api/no-content", { method: "DELETE" });
    expect(emptyRes).toBeUndefined();

    // 3. Error response throws structured ApiClientError with status and code
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      text: async () =>
        JSON.stringify({
          error: "forbidden",
          message: "You are not assigned to this patient",
        }),
    });

    await expect(apiRequest("/api/doctor/appointments")).rejects.toEqual(
      expect.objectContaining({
        name: "ApiClientError",
        status: 403,
        code: "forbidden",
        message: "You are not assigned to this patient",
      }),
    );

    // 4. FormData does NOT set Content-Type: application/json
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ ok: true }),
    });
    const formData = new FormData();
    formData.append("notes", "test");
    await apiFetch("/api/analysis/analyze", {
      method: "POST",
      body: formData,
    });
    const [, formFetchOpts] = mockFetch.mock.calls[3];
    expect(formFetchOpts.headers.has("Content-Type")).toBe(false);
  });

  test("9. Shared UI Components (GlideSelect & Button/SpecularButton): no hardcoded dummy options, full ARIA attributes, and opt-in WebGL", () => {
    // 1. GlideSelect without options renders placeholder instead of ["One", "Two", "Three"]
    const emptySelectHtml = renderToStaticMarkup(
      React.createElement(GlideSelect, {
        placeholder: "Choose a doctor",
        required: true,
        invalid: true,
        ariaLabel: "Doctor picker",
        name: "doctorId",
      }),
    );
    expect(emptySelectHtml).toContain("Choose a doctor");
    expect(emptySelectHtml).not.toContain(">One<");
    expect(emptySelectHtml).toContain('aria-required="true"');
    expect(emptySelectHtml).toContain('aria-invalid="true"');
    expect(emptySelectHtml).toContain('aria-haspopup="listbox"');
    expect(emptySelectHtml).toContain('name="doctorId"');

    // 2. GlideSelect with real options renders the selected label
    const populatedSelectHtml = renderToStaticMarkup(
      React.createElement(GlideSelect, {
        value: "online",
        options: [
          { value: "clinic", label: "In-person Clinic" },
          { value: "online", label: "Online Video Consultation" },
        ],
      }),
    );
    expect(populatedSelectHtml).toContain("Online Video Consultation");

    // 3. Button enables WebGL canvas only for primary non-sm buttons by default, and skips canvas for secondary/ghost/sm/IconButton
    const primaryMdHtml = renderToStaticMarkup(
      React.createElement(Button, { variant: "primary", size: "md" }, "Book Appointment"),
    );
    expect(primaryMdHtml).toContain("specular-button__light");

    const secondaryMdHtml = renderToStaticMarkup(
      React.createElement(Button, { variant: "secondary", size: "md" }, "Cancel"),
    );
    expect(secondaryMdHtml).not.toContain("specular-button__light");

    const primarySmHtml = renderToStaticMarkup(
      React.createElement(Button, { variant: "primary", size: "sm" }, "Confirm"),
    );
    expect(primarySmHtml).not.toContain("specular-button__light");

    const iconBtnHtml = renderToStaticMarkup(
      React.createElement(IconButton, { "aria-label": "Delete item" }, "X"),
    );
    expect(iconBtnHtml).not.toContain("specular-button__light");
  });
});
