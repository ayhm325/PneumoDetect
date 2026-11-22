#!/usr/bin/env node
import fetch from "node-fetch";

async function main() {
  const timestamp = Date.now();
  const email = `test-patient-${timestamp}@example.com`;
  const localePath = "/ar";
  const base = "http://localhost:3000";

  console.log("Creating patient:", email);
  const res = await fetch(`${base}${localePath}/api/patient`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password: "Password123!",
      fullName: "Test Patient",
      role: "patient",
    }),
  });
  const created = await res.json();
  console.log("POST /ar/api/patient =>", res.status, created);

  console.log("\nFetching admin patients list...");
  const listRes = await fetch(`${base}/api/admin/patients`);
  const list = await listRes.json();
  console.log("GET /api/admin/patients =>", listRes.status);
  // find our patient in list (by linked user email)
  const found = Array.isArray(list)
    ? list.find((p) => p.user && p.user.email === email)
    : null;
  console.log("Found entry for created patient:", !!found);
  if (found) console.log(JSON.stringify(found, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
