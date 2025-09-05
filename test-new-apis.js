#!/usr/bin/env node

/**
 * Test Script for New API Endpoints
 * This script tests the new API endpoints to ensure they work correctly
 */

const API_BASE = "http://localhost:3000/api";

// Mock data for testing
const testData = {
  poll: {
    title: "Test Poll for API Testing",
    description: "This is a test poll to verify API functionality",
    options: ["Option 1", "Option 2", "Option 3"],
  },
  userToken: "mock-jwt-token-here", // Replace with actual token for testing
};

// Test functions
async function testPollCreation() {
  console.log("🧪 Testing Poll Creation...");

  try {
    const response = await fetch(`${API_BASE}/polls`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testData.userToken}`,
      },
      body: JSON.stringify(testData.poll),
    });

    const result = await response.json();
    console.log(
      "✅ Poll Creation:",
      response.status === 201 ? "SUCCESS" : "FAILED",
    );
    console.log("   Response:", result.message);

    return result.pollId;
  } catch (error) {
    console.log("❌ Poll Creation: FAILED");
    console.log("   Error:", error.message);
    return null;
  }
}

async function testPollVoting(pollId) {
  console.log("🧪 Testing Poll Voting...");

  try {
    // First get poll options
    const pollResponse = await fetch(`${API_BASE}/polls/${pollId}/vote`);
    const pollData = await pollResponse.json();

    if (!pollData.success || !pollData.poll.options.length) {
      console.log("❌ Poll Voting: FAILED - No options found");
      return;
    }

    const optionId = pollData.poll.options[0].id;

    // Submit vote
    const voteResponse = await fetch(`${API_BASE}/polls/${pollId}/vote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${testData.userToken}`,
      },
      body: JSON.stringify({ option_id: optionId }),
    });

    const voteResult = await voteResponse.json();
    console.log(
      "✅ Poll Voting:",
      voteResponse.status === 201 ? "SUCCESS" : "FAILED",
    );
    console.log("   Response:", voteResult.message);
  } catch (error) {
    console.log("❌ Poll Voting: FAILED");
    console.log("   Error:", error.message);
  }
}

async function testPollAnalytics(pollId) {
  console.log("🧪 Testing Poll Analytics...");

  try {
    const response = await fetch(`${API_BASE}/polls/${pollId}/analytics`, {
      headers: {
        Authorization: `Bearer ${testData.userToken}`,
      },
    });

    const result = await response.json();
    console.log(
      "✅ Poll Analytics:",
      response.status === 200 ? "SUCCESS" : "FAILED",
    );
    console.log("   Response:", result.message || "Analytics data retrieved");
  } catch (error) {
    console.log("❌ Poll Analytics: FAILED");
    console.log("   Error:", error.message);
  }
}

async function testPollSearch() {
  console.log("🧪 Testing Poll Search...");

  try {
    const response = await fetch(`${API_BASE}/polls/search?q=test&limit=5`);
    const result = await response.json();

    console.log(
      "✅ Poll Search:",
      response.status === 200 ? "SUCCESS" : "FAILED",
    );
    console.log(
      "   Response:",
      result.message || `${result.results?.polls?.length || 0} polls found`,
    );
  } catch (error) {
    console.log("❌ Poll Search: FAILED");
    console.log("   Error:", error.message);
  }
}

async function testUserDashboard() {
  console.log("🧪 Testing User Dashboard...");

  try {
    const response = await fetch(`${API_BASE}/user/dashboard`, {
      headers: {
        Authorization: `Bearer ${testData.userToken}`,
      },
    });

    const result = await response.json();
    console.log(
      "✅ User Dashboard:",
      response.status === 200 ? "SUCCESS" : "FAILED",
    );
    console.log("   Response:", result.message || "Dashboard data retrieved");
  } catch (error) {
    console.log("❌ User Dashboard: FAILED");
    console.log("   Error:", error.message);
  }
}

async function testPollSharing(pollId) {
  console.log("🧪 Testing Poll Sharing...");

  try {
    const response = await fetch(`${API_BASE}/polls/${pollId}/share`);
    const result = await response.json();

    console.log(
      "✅ Poll Sharing:",
      response.status === 200 ? "SUCCESS" : "FAILED",
    );
    console.log("   Response:", result.message || "Sharing data retrieved");
    console.log(
      "   QR Code:",
      result.sharing?.qr_code ? "Generated" : "Not generated",
    );
  } catch (error) {
    console.log("❌ Poll Sharing: FAILED");
    console.log("   Error:", error.message);
  }
}

// Main test runner
async function runTests() {
  console.log("🚀 Starting API Tests...");
  console.log("=====================================");

  // Test poll creation first
  const pollId = await testPollCreation();

  if (pollId) {
    // Test other endpoints with the created poll
    await testPollVoting(pollId);
    await testPollAnalytics(pollId);
    await testPollSharing(pollId);
  }

  // Test endpoints that don't require a specific poll
  await testPollSearch();
  await testUserDashboard();

  console.log("=====================================");
  console.log("🏁 API Tests Completed!");
  console.log("");
  console.log("📝 Note: Some tests may fail if:");
  console.log("   - Server is not running (npm run dev)");
  console.log("   - Database is not set up");
  console.log("   - Authentication tokens are invalid");
  console.log("   - Poll ID is not found");
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testPollCreation,
  testPollVoting,
  testPollAnalytics,
  testPollSearch,
  testUserDashboard,
  testPollSharing,
  runTests,
};
