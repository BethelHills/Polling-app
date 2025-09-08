/**
 * Environment variable validation and security checks
 * Ensures proper configuration and prevents security issues
 */

interface EnvironmentConfig {
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  NODE_ENV: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate environment variables for security and completeness
 */
export function validateEnvironment(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required client-side variables
  const requiredClientVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };

  // Required server-side variables (only check on server)
  const requiredServerVars = {
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };

  // Validate client-side variables
  for (const [key, value] of Object.entries(requiredClientVars)) {
    if (!value) {
      errors.push(`Missing required environment variable: ${key}`);
    } else if (value.includes("placeholder") || value.includes("your-")) {
      // Allow placeholder values in CI/CD environment
      if (process.env.CI || process.env.GITHUB_ACTIONS) {
        warnings.push(`Environment variable ${key} contains placeholder value (CI/CD mode)`);
      } else {
        errors.push(`Environment variable ${key} contains placeholder value`);
      }
    } else if (
      key === "NEXT_PUBLIC_SUPABASE_ANON_KEY" &&
      !value.startsWith("eyJ")
    ) {
      warnings.push(`Environment variable ${key} may not be a valid JWT token`);
    }
  }

  // Validate server-side variables (only on server)
  if (typeof window === "undefined") {
    for (const [key, value] of Object.entries(requiredServerVars)) {
      if (!value) {
        // Allow missing service role key in CI/CD for client-side builds
        if (process.env.CI || process.env.GITHUB_ACTIONS) {
          warnings.push(`Server environment variable ${key} missing (CI/CD mode)`);
        } else {
          errors.push(`Missing required server environment variable: ${key}`);
        }
      } else if (value.includes("placeholder") || value.includes("your-")) {
        // Allow placeholder values in CI/CD environment
        if (process.env.CI || process.env.GITHUB_ACTIONS) {
          warnings.push(`Server environment variable ${key} contains placeholder value (CI/CD mode)`);
        } else {
          errors.push(
            `Server environment variable ${key} contains placeholder value`,
          );
        }
      } else if (
        key === "SUPABASE_SERVICE_ROLE_KEY" &&
        !value.startsWith("sk-")
      ) {
        warnings.push(
          `Environment variable ${key} may not be a valid service role key`,
        );
      }
    }
  }

  // Security checks
  const securityIssues = checkForSecurityIssues();
  errors.push(...securityIssues.errors);
  warnings.push(...securityIssues.warnings);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check for security issues in environment configuration
 */
function checkForSecurityIssues(): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if service role key is exposed to client
  if (typeof window !== "undefined" && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    errors.push(
      "🚨 SECURITY CRITICAL: Service role key exposed to client-side code!",
    );
  }

  // Check for NEXT_PUBLIC_ prefix on sensitive variables
  const sensitiveVars = ["SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY"];
  for (const varName of sensitiveVars) {
    if (process.env[`NEXT_PUBLIC_${varName}`]) {
      errors.push(
        `🚨 SECURITY CRITICAL: Sensitive variable ${varName} has NEXT_PUBLIC_ prefix!`,
      );
    }
  }

  // Check for hardcoded keys in environment variables
  const envString = JSON.stringify(process.env);
  if (envString.includes("sk-") && typeof window !== "undefined") {
    errors.push(
      "🚨 SECURITY CRITICAL: Service role key pattern found in client environment!",
    );
  }

  // Check for development keys in production
  if (process.env.NODE_ENV === "production") {
    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("localhost") ||
      process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("127.0.0.1")
    ) {
      warnings.push("Production environment using localhost URL");
    }
  }

  // Check for missing HTTPS in production
  if (
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith("https://")
  ) {
    warnings.push("Production environment should use HTTPS URLs");
  }

  return { errors, warnings };
}

/**
 * Get environment configuration with validation
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const validation = validateEnvironment();

  if (!validation.isValid) {
    console.error("❌ Environment validation failed:");
    validation.errors.forEach((error) => console.error(`  ${error}`));
    validation.warnings.forEach((warning) => console.warn(`  ⚠️ ${warning}`));

    // In production, throw error to prevent startup (but allow CI/CD builds)
    if (process.env.NODE_ENV === "production" && !process.env.CI && !process.env.GITHUB_ACTIONS) {
      throw new Error("Environment validation failed. Check configuration.");
    }
  } else if (validation.warnings.length > 0) {
    console.warn("⚠️ Environment validation warnings:");
    validation.warnings.forEach((warning) => console.warn(`  ${warning}`));
  } else {
    console.log("✅ Environment validation passed");
  }

  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NODE_ENV: process.env.NODE_ENV || "development",
  };
}

/**
 * Check if running in secure environment
 */
export function isSecureEnvironment(): boolean {
  const validation = validateEnvironment();
  return validation.isValid && validation.errors.length === 0;
}

/**
 * Get environment summary for debugging (without exposing secrets)
 */
export function getEnvironmentSummary(): Record<string, unknown> {
  const config = getEnvironmentConfig();

  return {
    NODE_ENV: config.NODE_ENV,
    NEXT_PUBLIC_SUPABASE_URL: config.NEXT_PUBLIC_SUPABASE_URL
      ? "✅ Set"
      : "❌ Missing",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: config.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ? "✅ Set"
      : "❌ Missing",
    SUPABASE_SERVICE_ROLE_KEY: config.SUPABASE_SERVICE_ROLE_KEY
      ? "✅ Set"
      : "❌ Missing",
    isClient: typeof window !== "undefined",
    isSecure: isSecureEnvironment(),
  };
}

/**
 * Runtime security check for client-side code
 */
export function performClientSecurityCheck(): void {
  if (typeof window === "undefined") {
    return; // Server-side, skip check
  }

  // Check for service role key exposure
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("🚨 SECURITY BREACH: Service role key exposed to client!");
    throw new Error("Service role key must not be exposed to client-side code");
  }

  // Check for NEXT_PUBLIC_ prefix on sensitive variables
  const sensitiveVars = ["SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY"];
  for (const varName of sensitiveVars) {
    if (process.env[`NEXT_PUBLIC_${varName}`]) {
      console.error(`🚨 SECURITY BREACH: ${varName} has NEXT_PUBLIC_ prefix!`);
      throw new Error(
        `Sensitive variable ${varName} must not have NEXT_PUBLIC_ prefix`,
      );
    }
  }

  console.log("✅ Client-side security check passed");
}

/**
 * Initialize environment validation
 * Call this at application startup
 */
export function initializeEnvironmentValidation(): void {
  // Always validate environment
  const validation = validateEnvironment();

  if (!validation.isValid) {
    console.error("❌ Environment validation failed:");
    validation.errors.forEach((error) => console.error(`  ${error}`));

    // In production, prevent startup (but allow CI/CD builds)
    if (process.env.NODE_ENV === "production" && !process.env.CI && !process.env.GITHUB_ACTIONS) {
      throw new Error(
        "Environment validation failed. Application cannot start.",
      );
    }
  }

  // Perform client-side security check
  if (typeof window !== "undefined") {
    performClientSecurityCheck();
  }

  // Log environment summary
  const summary = getEnvironmentSummary();
  console.log("🔧 Environment Summary:", summary);
}
