#!/usr/bin/env tsx

import { getEnvironmentSummary } from "../lib/env-validation";

try {
  const summary = getEnvironmentSummary();
  console.log("🔧 Environment Summary:");
  console.log(JSON.stringify(summary, null, 2));
} catch (error) {
  console.error("❌ Environment check failed:", error);
  process.exit(1);
}
