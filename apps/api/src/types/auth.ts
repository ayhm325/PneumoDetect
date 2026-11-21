export type LoginCommand = {
  email: string;
  password: string;
  ip: string | null;
};

export type LoginUserDto = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  doctor?: {
    status?: string;
  } | null;
  isDeleted?: boolean;
};

export type LoginResult = {
  user: Record<string, unknown>;
  token: string;
  tokenForDev?: string;
};

export type RegisterPatientCommand = {
  email: string;
  password: string;
  fullName: string;
  phone?: string | null;
  doctorId: string;
};

export type RegisterPatientResult = {
  user: {
    id: string;
    email: string;
    fullName: string;
    patientId: string;
  };
};

export type RegisterDoctorCommand = {
  email: string;
  password: string;
  fullName: string;
  licenseNumber: string;
  phone: string;
};

export type RegisterDoctorResult = {
  success: true;
};

export type WhoAmIResult = {
  id: string;
  role?: string;
  email?: string;
};

export type LogoutResult = {
  ok: true;
};
