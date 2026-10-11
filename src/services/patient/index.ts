import { createPatientPortalRepository } from "../../repositories/patient/patientPortalRepository";
import { createPatientDoctorChangeRequestRepository } from "../../repositories/patient/patientDoctorChangeRequestRepository";
import { createPatientDoctorChangeRequestService } from "./patientDoctorChangeRequestService";
import { createPatientPortalService } from "./patientPortalService";

const patientPortalRepository = createPatientPortalRepository();
const patientDoctorChangeRequestRepository = createPatientDoctorChangeRequestRepository();

export const patientPortalService = createPatientPortalService({
  patientPortalRepository,
});

export const patientDoctorChangeRequestService = createPatientDoctorChangeRequestService({
  patientDoctorChangeRequestRepository,
});
