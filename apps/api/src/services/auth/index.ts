import { createAuthActivityRepository } from "../../repositories/auth/activityRepository";
import { createAuthDoctorRepository } from "../../repositories/auth/doctorRepository";
import { createAuthNotificationRepository } from "../../repositories/auth/notificationRepository";
import { createPasswordRepository } from "../../repositories/auth/passwordRepository";
import { createAuthSessionRepository } from "../../repositories/auth/sessionRepository";
import { createAuthUserRepository } from "../../repositories/auth/userRepository";
import { createAuthService } from "./authService";
import { createInMemoryLoginAttemptStore } from "./loginAttemptStore";
import { createPasswordService } from "./passwordService";
import { createSessionService } from "./sessionService";

const WINDOW_MINUTES = 15;
const MAX_ATTEMPTS = 5;

const userRepository = createAuthUserRepository();
const doctorRepository = createAuthDoctorRepository();
const activityRepository = createAuthActivityRepository();
const notificationRepository = createAuthNotificationRepository();
const passwordRepository = createPasswordRepository();
const sessionRepository = createAuthSessionRepository();
const loginAttemptStore = createInMemoryLoginAttemptStore(WINDOW_MINUTES);

export const authService = createAuthService({
  userRepository,
  doctorRepository,
  activityRepository,
  notificationRepository,
  loginAttemptStore,
  maxAttempts: MAX_ATTEMPTS,
  windowMinutes: WINDOW_MINUTES,
});

export const sessionService = createSessionService({
  sessionRepository,
});

export const passwordService = createPasswordService({
  passwordRepository,
  notificationRepository,
});
