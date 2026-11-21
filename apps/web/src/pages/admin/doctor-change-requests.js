import { useEffect, useState } from "react";

// جلب جميع الطلبات (ليست فقط المعلقة) من API
export function useDoctorChangeRequests(refreshKey = 0) {
  const [requests, setRequests] = useState([]);
  useEffect(() => {
    fetch("/api/admin/doctor-change-requests?all=1")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.requests)) {
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
  const res = await fetch("/api/admin/doctor-change-requests", {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, action: "approve" }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || "UNKNOWN_ERROR");
  return true;
}

// رفض الطلب
export async function rejectDoctorChangeRequest(id) {
  const res = await fetch("/api/admin/doctor-change-requests", {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, action: "reject" }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || "UNKNOWN_ERROR");
  return true;
}