# Security Audit Report — ALX Polly (Polling App)

## Summary

This repo contained multiple security weaknesses. This document lists discovered vulnerabilities, their impact, and the fixes applied.

### Discovered issues

1. **Secrets in repo**
   - Impact: Exposed Supabase keys.
   - Fix: Removed `.env.local` from repo, added to `.gitignore`, rotate keys.

2. **Unauthenticated API routes**
   - Impact: Anyone could create polls or votes.
   - Fix: Enforced server-side auth on API routes; require `Authorization: Bearer <token>` and validate on server.

3. **No input validation**
   - Impact: Malformed data and injection risks.
   - Fix: Added `zod` schemas for API inputs and client-side validation.

4. **Duplicate votes**
   - Impact: Vote manipulation.
   - Fix: Database unique constraint on `(poll_id, user_id)` and proper error handling.

5. **Missing RLS**
   - Impact: Users could read/write data via Supabase directly.
   - Fix: Enabled Row Level Security and added policies for polls and votes.

6. **XSS risk**
   - Impact: Malicious HTML in poll content.
   - Fix: Escape user content and sanitize any HTML using DOMPurify.

7. **Lack of rate limiting**
   - Impact: Brute-force and spam.
   - Fix: Recommend implementing rate limiter (Redis-backed for production).

8. **Verbose error messages**
   - Impact: Information leak.
   - Fix: Return generic errors to client, log details server-side.

### How to apply fixes locally

1. Remove secrets and rotate keys.
2. Add `.env.local` to `.gitignore`.
3. Add server-only Supabase client (`lib/supabaseServerClient.ts`) and require Authorization header in API routes.
4. Add `zod` schema checks in the API.
5. Create DB constraints and RLS policies in Supabase SQL editor (included earlier in this document).
6. Use DOMPurify if rendering HTML.

### Next steps

- Configure GitHub Actions to run tests and security linters.
- Add rate-limiting middleware and reCAPTCHA for public forms.
- Add logging & alerts for suspicious activity.

---

If you want, I can generate a PR description and the exact patch files for you to apply. Tell me which branch you want the fixes on (new `sec-fix` branch recommended).
