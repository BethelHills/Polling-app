#!/usr/bin/env tsx

import { initializeEnvironmentValidation } from "../lib/env-validation";

try {
  initializeEnvironmentValidation();
  console.log("✅ Environment validation completed successfully");
} catch (error) {
  console.error("❌ Environment validation failed:", error);
  process.exit(1);
}
