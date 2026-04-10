COMPREHENSIVE SECURITY AUDIT — CortexMD

Act as a senior security engineer with expertise in Next.js, Supabase, Stripe/ЮKassa, and Anthropic API. Perform a full security audit of this project across all attack surfaces.

This is a READ-ONLY analysis pass first. Do NOT make code changes during the audit. Generate a structured report. After the report, I will tell you which findings to fix and in what order.

═══════════════════════════════════════════════════════════
SCOPE
═══════════════════════════════════════════════════════════

Analyze the entire codebase including:
1. All files in src/app/api/**
2. All Server Actions (files with 'use server')
3. All Supabase migrations in supabase/migrations/**
4. All client components that handle user input
5. All auth-related files ( src/lib/auth/** , src/lib/admin-session.ts, middleware.ts)
6. All environment variable usage ( process.env.* )
7. package.json dependencies
8. .env.example, .gitignore
9. Vercel deployment config (vercel.json if exists)

═══════════════════════════════════════════════════════════
AUDIT CHECKLIST
═══════════════════════════════════════════════════════════

═══ 1. AUTHENTICATION ═══

Check and report:
1.1 Password hashing: bcrypt or argon2 (NOT md5/sha1/plain). Where: any custom auth logic. Supabase handles this for built-in auth — verify nothing custom bypasses it.
1.2 Session lifetime: max-age set, expires correctly, invalidated on logout. Check iron-session config in src/lib/admin-session.ts and Supabase auth session handling.
1.3 Email verification enabled for new accounts (Supabase auth setting).
1.4 Password reset tokens: single-use, expire within 1 hour, cryptographically random.
1.5 Login endpoint rate limiting: max 5 attempts per minute per IP.
1.6 Auth secrets (JWT_SECRET, SUPABASE_SERVICE_ROLE_KEY, ADMIN_SESSION_SECRET, ANTHROPIC_API_KEY) NEVER reach client bundle. Check for accidental imports in client components.
1.7 OAuth redirects validated (no open redirect to attacker domains).
1.8 Middleware checks session on protected routes. Check middleware.ts and individual page auth guards.
1.9 Hard-fail on missing env secrets (no insecure fallbacks).

═══ 2. AUTHORIZATION & DATA OWNERSHIP ═══

For every API route and Server Action, verify:
2.1 Endpoints that take resource ID from URL/body verify ownership (auth.uid() === resource.user_id or equivalent).
2.2 SELECT queries include WHERE user_id = auth.uid() filter where appropriate.
2.3 UPDATE and DELETE operations verify ownership before mutation.
2.4 API routes that should require auth actually call requireAdmin() / getUser() / equivalent.
2.5 Supabase RLS policies cover ALL tables and ALL operations (SELECT, INSERT, UPDATE, DELETE). Tables without RLS enabled = critical finding.
2.6 Server Actions and Route Handlers: every entry point checks auth.getUser() before any DB operation.
2.7 Page server components fetch data only after auth check. Information disclosure via unauth'd page render = important finding.

For each violation, describe:
1. Which endpoint or function is vulnerable
2. How an attacker could exploit it (concrete example: "User A could GET /api/labs/[id] with User B's lab id and read it")
3. Suggested fix with code

═══ 3. INPUT VALIDATION ═══

Find every place user input enters the system. Check:
3.1 Zod schema (or equivalent runtime validation) on the server side. TypeScript types alone are NOT validation — they're erased at runtime.
3.2 SQL queries: parameterized via Supabase SDK or prepared statements. No raw SQL with string concatenation.
3.3 HTML output: no dangerouslySetInnerHTML with raw user content. React JSX escapes by default — verify no manual bypasses.
3.4 File uploads: MIME type, file size, extension validation. Magic bytes check for true file type, not just extension.
3.5 Redirect URLs validated against allowlist (no open redirect).
3.6 JSONB fields validated against schema, not accepting arbitrary structure.
3.7 Numeric parameters (limit, offset, page, dose, age) have upper and lower bounds. Default to safe values, reject NaN/Infinity.
3.8 Length limits on text fields (preset names, lab notes, treatment reasons). Otherwise DB bloat or DoS via huge inputs.

═══ 4. SECRETS MANAGEMENT ═══

Scan for exposed credentials:
4.1 No API keys, database URLs, service keys hardcoded in source code. Search for patterns like "sk_", "pk_", "Bearer ", connection strings.
4.2 .env files in .gitignore.
4.3 .env.example contains placeholders only, no real values.
4.4 SUPABASE_SERVICE_ROLE_KEY used ONLY in server code (API Routes, Server Actions, Edge Functions). Any client-side import = critical.
4.5 NEXT_PUBLIC_* variables contain NO secrets (anything with this prefix is visible in browser bundle).
4.6 ANTHROPIC_API_KEY used only on server (AI calls go through API routes, not direct from browser).
4.7 Stripe/ЮKassa secret keys server-only (browser only sees publishable key / shopId).
4.8 Git history check: run "git log -p | grep -i 'key\|secret\|password'" to find any historically committed secrets that need rotation.
4.9 Auth tokens stored in httpOnly cookies, not localStorage. Check Supabase auth client config and admin-session.ts.

═══ 5. RATE LIMITING & ABUSE PREVENTION ═══

Check or recommend:
5.1 Login endpoint: max 5 attempts per minute per IP.
5.2 Registration endpoint: max 3 accounts per hour per IP.
5.3 AI generation endpoint: per-plan limits (free vs pro tiers).
5.4 General API endpoints: max 100 requests per minute per user.
5.5 Resource IDs use UUID, not sequential integers (prevents enumeration attacks).
5.6 CAPTCHA or proof-of-work on public forms (registration, contact, AI chat from anonymous users).
5.7 Webhook signature validation: Stripe signature, ЮKassa HMAC SHA-256, Telegram secret token.
5.8 Request body size limits: 1MB for API, 10MB for file uploads. Check Next.js config and individual route configs.

For CortexMD specifically:
1. AI chat endpoint MUST have rate limiting before launch (it costs money)
2. Admin endpoints have implicit rate limiting via single-user assumption, but should still have logging
3. Lab/symptom/genetic data input endpoints should have reasonable per-user per-day limits to prevent DB bloat

═══ 6. DEPLOYMENT & MONITORING ═══

6.1 HTTPS enforced (HSTS header, HTTP to HTTPS redirect).
6.2 Secrets in Vercel Environment Variables, not in source.
6.3 Direct database access blocked from public internet (Supabase: network restrictions configured).
6.4 CORS configured strictly (specific domain, NOT wildcard " * " ).
6.5 Security headers: X-Frame-Options, X-Content-Type-Options, Content-Security-Policy, Referrer-Policy, Permissions-Policy.
6.6 Logging: auth attempts (successful and failed), API errors (4xx,5xx), suspicious activity (many 401/403 from single IP).
6.7 Anomaly monitoring: sudden traffic spikes, unusual patterns.
6.8 Database backups: Supabase daily auto-backups enabled, point-in-time recovery configured if available.
6.9 Vercel preview deployments: do NOT have access to production DB. Check that env vars are environment-scoped, not global.


═══ 7. DEPENDENCIES & SUPPLY CHAIN ═══
7.1 Run npm audit. Report all CRITICAL and HIGH severity findings.
7.2 Check for outdated packages with known CVEs.
7.3 Verify package-lock.json is committed (deterministic builds).
7.4 No unnecessary dependencies (smaller attack surface).

═══ 8. EDGE CASES & ERROR HANDLING ═══
8.1 What happens if Anthropic API is unavailable? Graceful degradation or crash?
8.2 What if Stripe/ЮKassa webhook arrives twice (idempotency)?
8.3 What if user uploads malformed Apple Health XML? Crash or safe error?
8.4 What if user provides invalid genetic data (e.g. unknown CYP variant)?
8.5 What if Supabase is temporarily down? Does the UI break or degrade?
8.6 What if a user's session is invalidated mid-request?
8.7 What if encryption key is lost (E2E flow): is there a graceful failure path or does the app crash?

═══════════════════════════════════════════════════════════
REPORT FORMAT
═══════════════════════════════════════════════════════════
For each finding, output in this exact format:
**Severity** : CRITICAL / IMPORTANT / RECOMMENDATION
**Category** : Authentication / Authorization / Input / Secrets / Rate Limiting / Deployment / Dependencies / Edge Case
**File**: path/to/file.ts:line_number
**Issue**: Brief description of what's wrong
**Risk**: What an attacker could do, or what could break
**Fix**: Concrete code or config change

After all findings, provide a summary table:

| Severity     | Count |
| CRITICAL     | N     |
| IMPORTANT    | N     |
| RECOMMENDATION| N    |

And a prioritized fix order (which to fix first based on exploitability 
and impact).

═══════════════════════════════════════════════════════════
RULES
═══════════════════════════════════════════════════════════

1. READ-ONLY first pass. Do not modify any files during audit.
2. Be specific. "API route X is vulnerable because..." not "auth might have issues".
3. Cite line numbers and exact file paths.
4. Distinguish between issues this PR introduced vs pre-existing issues.
5. If something is already secure, do NOT include it in findings (the report should be findings, not "everything you did right").
6. After delivering the report, STOP and wait for instructions on which fixes to apply and in what order.
7. Do not run npm audit fix automatically — report findings, let me decide.