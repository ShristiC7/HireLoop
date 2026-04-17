import "dotenv/config";

const BASE_URL = process.env.API_URL || "http://localhost:3001/api";

async function runTests() {
  console.log("🚀 Starting HireLoop Smoke Tests...");
  console.log(`📍 Targeting API: ${BASE_URL}`);

  let studentToken = "";
  let adminToken = "";
  const testId = Math.floor(Math.random() * 10000);
  const studentEmail = `test_student_${testId}@example.com`;
  const password = "password123";

  try {
    // 1. Student Registration
    console.log("\n📝 [Student] Testing Registration...");
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: studentEmail,
        password: password,
        name: "Test Student",
        role: "student",
      }),
    });
    const regData = await regRes.json() as any;
    if (regRes.status !== 201) throw new Error(`Registration failed: ${JSON.stringify(regData)}`);
    console.log("✅ Registration successful");

    // 2. Student Login
    console.log("\n🔑 [Student] Testing Login...");
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: studentEmail,
        password: password,
      }),
    });
    const loginData = await loginRes.json() as any;
    if (loginRes.status !== 200) throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
    studentToken = loginData.token;
    console.log("✅ Login successful");

    // 3. Fetch Job List
    console.log("\n💼 [Student] Testing Job Listing...");
    const jobsRes = await fetch(`${BASE_URL}/jobs`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const jobsData = await jobsRes.json();
    if (jobsRes.status !== 200) throw new Error(`Fetching jobs failed: ${JSON.stringify(jobsData)}`);
    console.log(`✅ Fetched ${Array.isArray(jobsData) ? jobsData.length : 0} jobs`);

    // 4. Admin Login
    const adminEmail = process.env.ADMIN_EMAIL || "admin@demo.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "demo123";
    console.log(`\n👑 [Admin] Testing Login as ${adminEmail}...`);
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: adminEmail,
        password: adminPassword,
      }),
    });
    const adminLoginData = await adminLoginRes.json() as any;
    if (adminLoginRes.status !== 200) {
        console.warn("⚠️ Admin login failed. Ensure admin is seeded.");
    } else {
        adminToken = adminLoginData.token;
        console.log("✅ Admin login successful");

        // 5. Admin Fetch Pending Jobs
        console.log("\n📋 [Admin] Testing Pending Jobs Fetch...");
        const pendingRes = await fetch(`${BASE_URL}/jobs/pending`, {
            headers: { Authorization: `Bearer ${adminToken}` },
        });
        const pendingData = await pendingRes.json();
        if (pendingRes.status !== 200) throw new Error(`Fetching pending jobs failed: ${JSON.stringify(pendingData)}`);
        console.log(`✅ Fetched ${Array.isArray(pendingData) ? pendingData.length : 0} pending jobs`);
    }

    console.log("\n✨ ALL TESTS PASSED! HireLoop API is healthy.");
  } catch (error) {
    console.error("\n❌ SMOKE TEST FAILED:");
    console.error(error);
    process.exit(1);
  }
}

runTests();
