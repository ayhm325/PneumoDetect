import { createDoctorPortalRepository } from "../../repositories/doctor/doctorPortalRepository";
import { createDoctorPortalService } from "./doctorPortalService";

const doctorPortalRepository = createDoctorPortalRepository();

export const doctorPortalService = createDoctorPortalService({
  doctorPortalRepository,
});
