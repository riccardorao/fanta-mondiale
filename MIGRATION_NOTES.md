# Dependency Migration Notes

## Next.js 14 → 15

- **App Router caching flip**: In Next.js 15, `fetch()` requests and Route Handlers are **no longer cached by default** (opt-in instead of opt-out). Any `fetch` call that relied on implicit caching must add `{ cache: 'force-cache' }` explicitly.
- **React 19 required**: Next.js 15 drops React 18 support. Upgrade `react` and `react-dom` to `^19.0.0` and update `@types/react`/`@types/react-dom` accordingly. Async Server Components and the new `use()` hook are now stable.
- **Turbopack default in dev**: `next dev` uses Turbopack by default. Some webpack-specific plugins/loaders may need replacements. Run `next dev --webpack` to opt out while you migrate.

Migration steps:
1. `npm install next@15 react@19 react-dom@19`
2. Run `npx @next/codemod@latest upgrade latest` to auto-fix known breaking changes.
3. Audit all `fetch()` calls and Route Handlers for caching intent.

---

## @supabase/ssr 0.4.x → 0.5.x

- **`createBrowserClient` / `createServerClient` API unchanged** — no breaking changes in cookie handling between 0.4 and 0.5.
- **`@supabase/auth-helpers-nextjs` removal**: If migrating from the older auth-helpers package, 0.5 is the first version that fully replaces it. Ensure all imports use `@supabase/ssr`.
- **Node 18+ required**: Drop support for Node 16. CI matrix and Vercel runtime must target Node 18+.

Migration steps:
1. `npm install @supabase/ssr@latest`
2. Test middleware cookie refresh end-to-end — the `setAll` pattern in `middleware.ts` is already compliant with 0.5.
