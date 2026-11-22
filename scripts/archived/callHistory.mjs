import jwt from "jsonwebtoken";

// Replace userId with the seeded user id in the DB
const USER_ID = "7e5dc12f-4c87-4e2f-a4cd-66c412e77f1a";
const SECRET = "3f8b2e1c-strong-secret-key-2025";

const token = jwt.sign({ id: USER_ID }, SECRET, { expiresIn: "1h" });

try {
  const res = await fetch("http://localhost:3000/api/analysis/history", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const text = await res.text();
  console.log("Status:", res.status);
  console.log(text);
} catch (e) {
  console.error("Request failed", e && e.message);
  process.exit(1);
}
