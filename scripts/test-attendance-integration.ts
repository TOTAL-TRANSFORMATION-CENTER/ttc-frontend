/**
 * Integration Test for Attendance System
 * Verifies public QR window, Admin Feature Settings, Duplicate Prevention,
 * Admin Edit Attendance (changing service), and Admin Delete Attendance.
 */

const BASE_URL = "http://localhost:3000";

async function runTests() {
  console.log("🚀 Starting Attendance System Integration Tests...\n");
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: unknown) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`, detail || "");
      failed++;
    }
  }

  // 0. Admin Login to setup clean state
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identifier: "+919876543210",
      password: "Admin@TTC2026!",
    }),
  });
  const loginJson = await loginRes.json();
  assert(loginJson.success === true, "Admin login successful");

  const setCookie = loginRes.headers.get("set-cookie") || "";
  const tokenMatch = setCookie.match(/ttc_access_token=([^;]+)/);
  const token = tokenMatch ? tokenMatch[1] : "";
  assert(Boolean(token), "Extracted admin access token");

  const adminHeaders = {
    "Content-Type": "application/json",
    Cookie: `ttc_access_token=${token}`,
  };

  // Reset portal mode to AUTOMATIC before starting
  await fetch(`${BASE_URL}/api/attendance/status`, {
    method: "PUT",
    headers: adminHeaders,
    body: JSON.stringify({ mode: "AUTOMATIC" }),
  });

  // 1. Check Initial Status (Closed on Friday)
  console.log("\n─── Test 1: Public Portal Status when AUTOMATIC ───");
  const statusRes = await fetch(`${BASE_URL}/api/attendance/status`);
  const statusJson = await statusRes.json();
  assert(statusJson.success === true, "Status endpoint returns success");
  assert(statusJson.data.mode === "AUTOMATIC", "Default mode is AUTOMATIC");
  assert(statusJson.data.isOpen === false, "Portal is closed on non-Sunday");
  assert(typeof statusJson.data.politeMessage === "string", "Polite closed message is present");

  const todayStr = statusJson.data.serviceDate || new Date().toISOString().split("T")[0];

  // 2. Public submission when closed -> Should reject with 403
  console.log("\n─── Test 2: Public Submission Blocked When Closed ───");
  const closedPostRes = await fetch(`${BASE_URL}/api/attendance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      familyId: "1c4a89de-5012-4911-8935-abd8d882c191",
      submissions: [{ memberId: "eb6ac82d-3ba6-41eb-b54c-32a21d7c7f84", service: "SERVICE_1" }],
    }),
  });
  assert(closedPostRes.status === 403, "Public submission rejected with 403 when closed");

  // 3. Admin Updates Portal Mode to FORCE_OPEN
  console.log("\n─── Test 3: Admin Updates Portal Mode to FORCE_OPEN ───");
  const forceOpenRes = await fetch(`${BASE_URL}/api/attendance/status`, {
    method: "PUT",
    headers: adminHeaders,
    body: JSON.stringify({ mode: "FORCE_OPEN" }),
  });
  const forceOpenJson = await forceOpenRes.json();
  assert(forceOpenJson.success === true, "Admin PUT status succeeds");
  assert(forceOpenJson.data.isOpen === true, "Portal is now OPEN via FORCE_OPEN");
  assert(forceOpenJson.data.mode === "FORCE_OPEN", "Mode updated to FORCE_OPEN");

  // 4. Family Search: Verify Head of Family formatting & attendance status
  console.log("\n─── Test 4: Family Search & Head of Family Format ───");
  const searchRes = await fetch(`${BASE_URL}/api/attendance/search?q=Super`);
  const searchJson = await searchRes.json();
  assert(searchJson.success === true, "Family search succeeds");
  assert(searchJson.data.length > 0, "Found at least 1 family");
  const family = searchJson.data[0];
  assert(family.familyName.includes("'s Family"), "Family Name formatted as Head's Family");
  assert(family.members.length > 0, "Family members loaded");

  const testMemberId = family.members[0].id;

  // Clean up any pre-existing record from previous test runs to ensure idempotency
  const preRosterRes = await fetch(
    `${BASE_URL}/api/admin/attendance?view=roster&date=${todayStr}`,
    { headers: adminHeaders }
  );
  const preRosterJson = await preRosterRes.json();
  if (preRosterJson.success && Array.isArray(preRosterJson.roster)) {
    for (const r of preRosterJson.roster) {
      if (r.memberId === testMemberId) {
        await fetch(`${BASE_URL}/api/admin/attendance?id=${r.id}`, {
          method: "DELETE",
          headers: adminHeaders,
        });
      }
    }
  }

  // 5. Public Submission when FORCE_OPEN -> Expect 200 & record created
  console.log("\n─── Test 5: Public Submission when FORCE_OPEN ───");
  const checkinRes = await fetch(`${BASE_URL}/api/attendance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      familyId: family.familyId,
      submissions: [{ memberId: testMemberId, service: "SERVICE_1" }],
    }),
  });
  const checkinJson = await checkinRes.json();
  assert(checkinJson.success === true, "Check-in succeeded");
  assert(checkinJson.recordedCount === 1, "Recorded 1 member");
  assert(checkinJson.skippedCount === 0, "0 skipped on first attempt");

  // 6. Duplicate Check-in Prevention
  console.log("\n─── Test 6: Duplicate Submission Prevention ───");
  const duplicateRes = await fetch(`${BASE_URL}/api/attendance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      familyId: family.familyId,
      submissions: [{ memberId: testMemberId, service: "SERVICE_1" }],
    }),
  });
  const duplicateJson = await duplicateRes.json();
  assert(duplicateRes.status === 409, "Duplicate attempt returns 409 Conflict");
  assert(duplicateJson.success === false, "Duplicate attempt has success: false");
  assert(duplicateJson.isAlreadySubmitted === true, "Duplicate attempt sets isAlreadySubmitted: true");
  assert(duplicateJson.recordedCount === 0, "0 recorded on duplicate attempt");
  assert(duplicateJson.skippedCount === 1, "1 member correctly skipped as duplicate");
  assert(duplicateJson.contactPhone === "+91 63798 71925", "Contact phone provided (+91 63798 71925)");
  assert(Boolean(duplicateJson.skippedMembers[0]?.submittedAtFormatted), "Exact submission time provided in response");

  // 7. Admin Attendance Roster Drilldown
  console.log("\n─── Test 7: Admin Attendance Roster Drilldown ───");
  const rosterRes = await fetch(
    `${BASE_URL}/api/admin/attendance?view=roster&date=${todayStr}&service=SERVICE_1`,
    { headers: adminHeaders }
  );
  const rosterJson = await rosterRes.json();
  assert(rosterJson.success === true, "Roster fetch succeeded");
  assert(rosterJson.count >= 1, "Roster contains recorded member");
  const record = rosterJson.roster.find((r: { memberId: string; id: string }) => r.memberId === testMemberId);
  assert(Boolean(record), "Found member in roster");
  const attendanceId = record.id;

  // 8. Admin Edit Attendance (Change Service)
  console.log("\n─── Test 8: Admin Edit Attendance (Change Service to SERVICE_2) ───");
  const editRes = await fetch(`${BASE_URL}/api/admin/attendance`, {
    method: "PATCH",
    headers: adminHeaders,
    body: JSON.stringify({
      attendanceId,
      service: "SERVICE_2",
      notes: "Updated by Admin in integration test",
    }),
  });
  const editJson = await editRes.json();
  assert(editJson.success === true, "Admin edit succeeded");
  assert(editJson.data.service === "SERVICE_2", "Service updated to SERVICE_2");
  assert(editJson.data.notes === "Updated by Admin in integration test", "Notes updated");

  // 9. Admin Delete Attendance
  console.log("\n─── Test 9: Admin Delete Attendance ───");
  const deleteRes = await fetch(`${BASE_URL}/api/admin/attendance?id=${attendanceId}`, {
    method: "DELETE",
    headers: adminHeaders,
  });
  const deleteJson = await deleteRes.json();
  assert(deleteJson.success === true, "Admin delete succeeded");

  // Verify record no longer exists
  const afterDeleteRoster = await fetch(
    `${BASE_URL}/api/admin/attendance?view=roster&date=${todayStr}`,
    { headers: adminHeaders }
  );
  const afterJson = await afterDeleteRoster.json();
  const deletedMember = afterJson.roster.find((r: { id: string }) => r.id === attendanceId);
  assert(!deletedMember, "Record deleted from roster");

  // 10. Unauthorized access rejection
  console.log("\n─── Test 10: Unauthorized Admin Endpoint Access ───");
  const unauthEdit = await fetch(`${BASE_URL}/api/admin/attendance`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ attendanceId: "dummy", service: "SERVICE_1" }),
  });
  assert(unauthEdit.status === 401, "Unauthenticated PATCH returns 401");

  const unauthDelete = await fetch(`${BASE_URL}/api/admin/attendance?id=dummy`, {
    method: "DELETE",
  });
  assert(unauthDelete.status === 401, "Unauthenticated DELETE returns 401");

  // Reset mode to AUTOMATIC
  await fetch(`${BASE_URL}/api/attendance/status`, {
    method: "PUT",
    headers: adminHeaders,
    body: JSON.stringify({ mode: "AUTOMATIC" }),
  });
  console.log("\n─── Teardown: Restored mode to AUTOMATIC ───");

  console.log(`\n========================================`);
  console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
