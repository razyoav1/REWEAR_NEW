# Security Audit Agent

Perform a thorough security audit of this React/TypeScript/Supabase codebase. This is a marketplace app that stores user emails, passwords (via Supabase Auth), addresses, and financial offers.

Check for:
1. **Exposed secrets** — API keys, tokens, passwords hardcoded in source files or .env committed to git
2. **Auth bypass** — pages accessible without login, missing route guards
3. **Insecure direct object access** — can user A read/edit user B's private data by changing an ID?
4. **Missing RLS indicators** — Supabase queries that fetch data without user_id filters (relies on RLS being correct server-side, but flag client-side concerns too)
5. **Sensitive data in logs** — `console.log` of emails, tokens, passwords, or addresses
6. **XSS risks** — `dangerouslySetInnerHTML`, unescaped user content rendered as HTML
7. **File upload validation** — are uploaded images checked for type and size before Supabase Storage upload?
8. **Input validation** — forms that accept user input without sanitization (price fields accepting strings, name fields accepting scripts)
9. **Anon key exposure** — Supabase anon key in client is expected, but service_role key must never appear client-side
10. **Third-party data sharing** — user data sent to analytics or third-party services without consent
11. **Password handling** — any custom password logic (Supabase handles hashing, but check for custom implementations)
12. **Private data in URLs** — emails, IDs, or tokens passed as URL query params
13. **CORS / CSP** — check vite.config.ts and any proxy settings
14. **Offer/price tampering** — can a buyer manipulate the offer amount client-side to send a fake price?

For each issue found, output:
- **File**: path and line number  
- **Severity**: Critical / High / Medium / Low
- **Description**: the vulnerability and potential exploit
- **Fix**: the corrected code or configuration

End with an overall security score (0–100) and a prioritized action list.
