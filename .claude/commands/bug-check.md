# Bug Checker Agent

Perform a thorough bug audit of this React/TypeScript/Supabase codebase. Scan ALL files under `src/`.

Check for:
1. **Logic bugs** — wrong conditions, off-by-one errors, incorrect boolean logic
2. **Null/undefined errors** — unguarded `.map()` on possibly-null arrays, missing optional chaining
3. **Missing await / async issues** — unawaited promises, missing try/catch in async functions
4. **React hooks violations** — hooks called conditionally, missing deps in useEffect, stale closures
5. **Memory leaks** — subscriptions or timers not cleaned up on unmount
6. **Type mismatches** — TypeScript `any` casts that could hide real errors
7. **Dead code** — imports, variables, or functions declared but never used
8. **Race conditions** — state updates after component unmount, concurrent fetches without cancellation
9. **Missing error handling** — Supabase queries without `.error` checks
10. **Broken navigation** — `useNavigate` calls with wrong routes

For each bug found, output:
- **File**: path and line number
- **Severity**: Critical / High / Medium / Low
- **Description**: what the bug is
- **Fix**: the corrected code snippet

End with a summary table sorted by severity.
