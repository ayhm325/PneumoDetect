import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/apiClient";

// جلب جميع الطلبات (ليست فقط المعلقة) من API
export function useDoctorChangeRequests(refreshKey = 0) {
  const [requests, setRequests] = useState([]);
  useEffect(() => {
    apiRequest("/api/admin/doctor-change-requests?all=true")
      .then((data) => {
        if (data?.success && Array.isArray(data.requests)) {
          setRequests(
            data.requests.map((r) => ({
              id: r.id,
              patientName: r.patientName || "",
              currentDoctorName:
                r.details?.currentDoctorName ||
                r.details?.currentDoctorId ||
                "",
              requestedDoctorName:
                r.details?.requestedDoctorName ||
                r.details?.requestedDoctorId ||
                "",
              status: r.status || "pending",
              reason: r.reason || r.details?.reason || "",
            })),
          );
        } else {
          setRequests([]);
        }
      })
      .catch(() => setRequests([]));
  }, [refreshKey]);
  return requests;
}

// الموافقة على الطلب
export async function approveDoctorChangeRequest(id) {
  const data = await apiRequest("/api/admin/doctor-change-requests", {
    method: "PATCH",
    body: JSON.stringify({ id, action: "approve" }),
  });
  if (!data?.success) throw new Error(data?.error || "UNKNOWN_ERROR");
  return true;
}

// رفض الطلب
export async function rejectDoctorChangeRequest(id) {
  const data = await apiRequest("/api/admin/doctor-change-requests", {
    method: "PATCH",
    body: JSON.stringify({ id, action: "reject" }),
  });
  if (!data?.success) throw new Error(data?.error || "UNKNOWN_ERROR");
  return true;
}
