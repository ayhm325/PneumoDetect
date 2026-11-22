import * as route from "../app/api/analysis/history/route.js";
import jwt from "jsonwebtoken";

const USER_ID = "7e5dc12f-4c87-4e2f-a4cd-66c412e77f1a";
const SECRET = "3f8b2e1c-strong-secret-key-2025";
const token = jwt.sign({ id: USER_ID }, SECRET, { expiresIn: "1h" });

const mockRequest = {
  cookies: new Map([["token", { value: token }]]),
  headers: new Map(),
};

// adapt to the shape used in the route: request.cookies.get and request.headers.get
mockRequest.cookies.get = function (k) {
  return this.get(k);
};
mockRequest.headers.get = function (k) {
  return this.get(k.toLowerCase());
};

(async () => {
  try {
    const res = await route.GET(mockRequest);
    console.log("Route returned:", res);
    // If NextResponse-like, try to extract body via res.json()
    if (res && typeof res.json === "function") {
      try {
        const body = await res.json();
        console.log("Body:", body);
      } catch (_) {}
    }
  } catch (e) {
    console.error("invokeHistory error:", e);
  }
})();
