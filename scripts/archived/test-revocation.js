/**
 * Simple node test script for revocation helper
 * Run with: node scripts/test-revocation.js
 */
import assert from "assert";
import {
  clearRevokedForTest,
  isTokenRevoked,
  addRevokedToken,
} from "../lib/auth/revocation.server.js";

async function run() {
  console.log("Clearing revoked list...");
  try {
    await clearRevokedForTest();
  } catch (e) {
    /* ignore */
  }

  const token = "test-token-123";
  let revoked = await isTokenRevoked(token);
  console.log("Initially revoked?", revoked);
  assert.strictEqual(revoked, false, "token should not be revoked initially");

  console.log("Adding revoked token...");
  await addRevokedToken(token, Date.now() + 1000 * 60 * 60);

  revoked = await isTokenRevoked(token);
  console.log("After adding revoked?", revoked);
  assert.strictEqual(revoked, true, "token should be revoked after adding");

  console.log("Test passed");
}

run().catch((e) => {
  console.error("Test failed", e);
  process.exit(1);
});
