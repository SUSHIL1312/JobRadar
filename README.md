# JobRadar — Personal Automated Job-Discovery Assistant

JobRadar is an autonomous personal job-search assistant designed to continuously discover, aggregate, normalize, deduplicate, and score job opportunities from legitimate sources and public ATS boards against a configured career profile.

> **Important Product Principle**: JobRadar is **NOT** an automatic job-application bot. It discovers, scores, and tracks jobs. Every application decision and submission is manually performed by you on the original employer or ATS page.

---

## Architecture Overview

JobRadar is deployed as a single, unified Cloudflare application combining a React SPA with a Cloudflare Worker backend, Cloudflare D1 database, and Cron Triggers.

```text
                 ┌────────────────────────────────┐
                 │       JobRadar Dashboard       │
                 │   React 18 + Vite + Tailwind   │
                 └───────────────┬────────────────┘
                                 │
                   HTTPS Request │ (SPA + /api/*)
                                 ▼
                 ┌────────────────────────────────┐
                 │   Unified Cloudflare Worker    │
                 │   (Routing + Cron Triggers)    │
                 ├───────────────┬────────────────┤
                 │ Static Assets │ REST Endpoints │
                 └───────────────┴────────┬───────┘
                                          │
            ┌─────────────────────────────┼─────────────────────────────┐
            ▼                             ▼                             ▼
   ┌──────────────────┐          ┌──────────────────┐          ┌──────────────────┐
   │  Cloudflare D1   │          │  Search Engine   │          │  Worker Secrets  │
   │  (SQLite DB)     │          │  (Lock & Budget) │          │ (RESEND_API_KEY) │
   └──────────────────┘          └────────┬─────────┘          └──────────────────┘
                                          │
                        ┌─────────────────┴─────────────────┐
                        │          Source Adapters          │
                        ├─────────────────┬─────────────────┤
                        │ • Greenhouse    │ • Lever         │
                        │ • Remotive      │ • Mock Generator│
                        └─────────────────┴─────────────────┘
```

---

## Features

- **Autonomous Background Discovery**: Runs on a schedule even when your browser is closed.
- **Deterministic Match Scoring**: Multi-factor scoring (Title 25%, Skills 35%, Seniority 15%, Experience 15%, Location/Remote 10%) with 100% transparency breakdown ("Why this match?"). No fake AI claims.
- **D1 Persistent Storage**: Authoritative career profile, skills, preferences, jobs, match scores, status history, and analytics stored in Cloudflare D1 SQLite.
- **Polite & Compliant Crawling**: Strict SSRF host allowlisting, request budgeting (`MAX_EXTERNAL_REQUESTS_PER_RUN`), rate limiting (429 handling), timeouts, and source failure isolation.
- **Application Workflow Pipeline**: Track status from `NEW` &rarr; `SELECTED` &rarr; `APPLIED` &rarr; `INTERVIEW` &rarr; `OFFER` with private notes, interview dates, and rounds.
- **Command Palette (`Cmd + K`)**: Quick keyboard navigation across views, search, and themes.
- **Mobile First UX**: Bottom navigation and drawer sheets designed for phones and tablets.
- **Email Notifications**: Responsive HTML digests sent via Resend when fresh matching jobs are discovered.

---

## Cloudflare Cron Schedules (IST ↔ UTC)

Cloudflare Cron Triggers execute strictly in **UTC**. The schedules in `wrangler.jsonc` map to Indian Standard Time (IST) as follows:

| IST Time | UTC Equivalent | Cron Expression | Run Purpose |
| :--- | :--- | :--- | :--- |
| **08:00 AM IST** | 02:30 UTC | `30 2 * * *` | Morning Primary Scan |
| **10:00 AM IST** | 04:30 UTC | `30 4 * * *` | Remote Boards & ATS Refresh |
| **01:00 PM IST** | 07:30 UTC | `30 7 * * *` | Mid-Day Scan |
| **05:00 PM IST** | 11:30 UTC | `30 11 * * *` | European / Early US Postings |
| **09:00 PM IST** | 15:30 UTC | `30 15 * * *` | Night Comprehensive Scan |

---

## Local Development Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Local Secrets
Copy the example file to `.dev.vars` (this file is excluded from Git):
```bash
cp .dev.vars.example .dev.vars
```

Edit `.dev.vars`:
```ini
RESEND_API_KEY=re_your_api_key_here
AUTH_SECRET=your_local_secret_here
```

### 3. Initialize Local D1 Database & Migrations
```bash
# Apply schema and initial profile seeds to local D1
npx wrangler d1 migrations apply jobradar-db --local
```

### 4. Run Development Servers
In terminal 1 (Vite Frontend with API proxy to port 8787):
```bash
npm run dev
```

In terminal 2 (Cloudflare Worker backend with local D1):
```bash
npx wrangler dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Cloudflare Hosting & Deployment Setup

### Step 1: Login to Cloudflare via Wrangler
```bash
npx wrangler login
```

### Step 2: Create Cloudflare D1 Database
Create the production D1 database on your Cloudflare account:
```bash
npx wrangler d1 create jobradar-db
```

This output will provide your `database_id`, for example:
```text
[[d1_databases]]
binding = "DB"
database_name = "jobradar-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

Update `wrangler.jsonc` with your real `database_id`:
```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "jobradar-db",
    "database_id": "YOUR_ACTUAL_DATABASE_ID_HERE",
    "migrations_dir": "migrations"
  }
]
```

### Step 3: Apply Remote Migrations
Run migrations against the production D1 database:
```bash
npx wrangler d1 migrations apply jobradar-db --remote
```

### Step 4: Configure Production Secrets
Set your Resend API key and optional auth token in Cloudflare Worker Secrets:
```bash
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put AUTH_SECRET
```

### Step 5: Build and Deploy
```bash
# Build the production frontend into dist/
npm run build

# Deploy Worker with static assets, D1 bindings, and Cron triggers
npx wrangler deploy
```

Your personal JobRadar instance will now be live on `https://jobradar.<your-subdomain>.workers.dev` (or your custom domain) with automated cron triggers active!

---

## Adding a New Job Source Adapter

1. **Create Adapter File**: Add `src/jobs/adapters/mySourceAdapter.ts` implementing `JobSource`:
   ```ts
   import { JobSource, RawJob, JobSearchProfile, SearchContext, SourceCapabilities } from '../../types';

   export class MySourceAdapter implements JobSource {
     id = 'mysource';
     name = 'My Source';
     type = 'ats' as const;
     enabled = true;
     priority = 'medium' as const;

     async search(profile: JobSearchProfile, context: SearchContext): Promise<RawJob[]> {
       // Check context.deadline and context.requestsUsed before each request
       // Fetch permitted data using safeHttpClient
       // Return RawJob[]
     }

     getCapabilities(): SourceCapabilities {
       return {
         supportsPagination: false,
         supportsDateFilter: true,
         providesExactSalary: false,
         providesFullDescription: true,
         rateLimitPerMinute: 60,
       };
     }
   }
   ```

2. **Allowlist Host in `src/config/index.ts`**:
   Add the external API domain to `ssrfAllowlist`.

3. **Register in `src/jobs/adapters/index.ts`**:
   Add `new MySourceAdapter()` to `ALL_JOB_SOURCES`.

4. **Add Unit Tests**:
   Create a test fixture and verify normalization.

---

## Testing & Quality Assurance

```bash
# Run unit tests (Normalization, Deduplication, Matching, Search Engine)
npm run test

# Run frontend & worker type checking
npm run typecheck

# Build production bundle
npm run build
```

---

## Security & Compliance Notice

- No scraping past CAPTCHAs, authentication barriers, or anti-bot protections.
- Zero credential storage in frontend or Git.
- Strict SSRF allowlisting on all external HTTP requests.
- All applications remain human-initiated and human-reviewed.
