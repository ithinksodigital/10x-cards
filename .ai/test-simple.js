// Simple API Testing Script
// Run with: node .ai/test-simple.js

const BASE_URL = "http://localhost:3001";

// Helper function to make API calls
async function apiCall(method, endpoint, data = null, description = "") {
  console.log("\n" + "=".repeat(60));
  console.log(`TEST: ${description}`);
  console.log("=".repeat(60));
  console.log(`Method: ${method}`);
  console.log(`Endpoint: ${endpoint}`);

  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      // Note: Add Authorization header when you have a token
      // 'Authorization': 'Bearer YOUR_TOKEN_HERE'
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
    console.log("Data:", JSON.stringify(data, null, 2));
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const responseData = await response.json();

    console.log(`\nStatus: ${response.status} ${response.statusText}`);
    console.log("Response:", JSON.stringify(responseData, null, 2));

    return { status: response.status, data: responseData };
  } catch (error) {
    console.error("Error:", error.message);
    return { status: 0, error: error.message };
  }
}

// Test scenarios
async function runTests() {
  console.log("\n🧪 Starting API Endpoint Tests...\n");

  // Test 1: Create Set (should fail with 401 - no auth)
  await apiCall(
    "POST",
    "/api/sets",
    { name: "Test Set", language: "en" },
    "Create Set (Expected: 401 Unauthorized without token)"
  );

  // Test 2: List Sets (should fail with 401 - no auth)
  await apiCall("GET", "/api/sets", null, "List Sets (Expected: 401 Unauthorized without token)");

  // Test 3: Invalid UUID format
  await apiCall("GET", "/api/sets/invalid-uuid", null, "Get Set with Invalid UUID (Expected: 400 Bad Request)");

  // Test 4: Missing required fields
  await apiCall("POST", "/api/sets", {}, "Create Set with Missing Fields (Expected: 400 Validation Error)");

  // Test 5: Invalid language
  await apiCall(
    "POST",
    "/api/sets",
    { name: "Test", language: "invalid" },
    "Create Set with Invalid Language (Expected: 400 Validation Error)"
  );

  // Test 6: Get Due Cards (should fail with 401)
  await apiCall("GET", "/api/srs/due", null, "Get Due Cards (Expected: 401 Unauthorized without token)");

  // Test 7: Invalid rating in review
  await apiCall(
    "POST",
    "/api/srs/reviews",
    {
      card_id: "00000000-0000-0000-0000-000000000000",
      rating: 10,
      session_id: "00000000-0000-0000-0000-000000000000",
    },
    "Submit Review with Invalid Rating (Expected: 400 Validation Error)"
  );

  console.log("\n" + "=".repeat(60));
  console.log("✅ Test Suite Completed!");
  console.log("=".repeat(60));
  console.log("\nNOTE: Most tests should return 401 Unauthorized");
  console.log("This is expected behavior - authentication is required.");
  console.log("\nTo test with authentication:");
  console.log("1. Get a Supabase JWT token");
  console.log("2. Add it to the Authorization header in this script");
  console.log("3. Run the full test flow\n");
}

// Run the tests
runTests().catch(console.error);
