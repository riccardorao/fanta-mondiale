# Fanta Mondiale ⚽

A World Cup bracket prediction game ("Code World Cup Bracket" / *fantamondiale*) where users
predict knockout-stage results, lock in their picks before kick-off, and climb a live leaderboard.

**Live:** https://fantaid.vercel.app

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | [Next.js 14](https://nextjs.org/) (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + `clsx` + `tailwind-merge` |
| Icons | `lucide-react` |
| Notifications | `react-hot-toast` |
| Dates | `date-fns` |
| Backend / Auth / DB | [Supabase](https://supabase.com/) (Postgres + Auth + RLS) |
| Hosting | [Vercel](https://vercel.com/) |

---

## Prerequisites

- **Node.js 20.9+** (LTS recommended)
- **npm** (the repo ships a `package-lock.json`)
- A **Supabase** account and project
- A **Vercel** account (for deployment)
- *(optional but recommended)* the [Supabase CLI](https://supabase.com/docs/guides/cli)
  for running migrations locally

---

## Getting Started (Local Development)

### 1. Clone and install

```bash
git clone https://github.com/riccardorao/fanta-mondiale.git
cd fanta-mondiale
npm install
```

### 2. Configure environment variables

Copy the example file and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

| Variable | Where to find it | Exposed to browser? |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL | ✅ Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → `anon` `public` key | ✅ Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → `service_role` key | ❌ **Never** |

> ⚠️ **Security note**
> The `service_role` key bypasses Row Level Security. It must **only** be used in
> server-side code (Route Handlers, Server Actions, server components) and must **never**
> be prefixed with `NEXT_PUBLIC_`. Keep `.env.local` out of version control (it is already
> covered by `.gitignore`).

### 3. Set up the database

If you use the Supabase CLI:

```bash
supabase link --project-ref <your-project-ref>
supabase db push          # applies the migrations in /supabase
```

Otherwise, open the Supabase SQL Editor and run the migration files found in the
[`/supabase`](./supabase) directory in order.

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run build` | Create an optimised production build |
| `npm run start` | Run the production build locally |
| `npm run lint` | Run ESLint (`eslint-config-next`) |

---

## Project Structure

```
fanta-mondiale/
├── .github/            # GitHub workflows / config
├── src/                # Application source (App Router, components, lib)
├── supabase/           # SQL migrations & schema (PLpgSQL)
├── .env.example        # Template for required environment variables
├── next.config.mjs     # Next.js configuration
├── postcss.config.mjs  # PostCSS / Tailwind pipeline
├── tailwind.config.ts  # Tailwind design tokens
├── tsconfig.json       # TypeScript configuration
└── vercel.json         # Vercel build/deploy configuration
```

---

## Deployment (Vercel)

1. Push your branch to GitHub.
2. In Vercel, **Import Project** and select the repository.
3. Framework preset is auto-detected as **Next.js** (no override needed).
4. Add the three environment variables above under
   **Settings → Environment Variables** (set them for *Production*, *Preview*, and
   *Development* as appropriate).
5. Deploy. Every push to `main` triggers a production deploy; every PR gets a preview URL.

> Make sure the Supabase project's **Auth → URL Configuration** lists your Vercel
> production domain and the `*.vercel.app` preview pattern as allowed redirect URLs,
> otherwise auth callbacks will fail in preview/production.

---

## Database & Security

- Row Level Security (RLS) should be **enabled on every table** that holds user data.
- Predictions should only be writable by their owner and only **before the relevant
  match kick-off** (enforce with an RLS policy and/or a database `CHECK` / trigger, not
  just in the UI).
- The leaderboard is best served from a Postgres **view** or a scheduled function so
  scoring logic lives in one place.

---

## Contributing

Issues and pull requests are welcome. Please run `npm run lint` and `npm run build`
before opening a PR.

---

## License

_No license file is currently present._ Add a `LICENSE` (e.g. MIT) if you intend the
project to be reused, or state "All rights reserved" if not.
