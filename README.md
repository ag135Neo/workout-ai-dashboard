# Workout AI Dashboard

A complete Next.js repo that turns workout-log photos into the same dark workout progress dashboard from the original standalone HTML.

## What this includes

- Same dashboard layout/style as the original HTML:
  - muscle-group and exercise filters
  - Coach/Self filter
  - date view
  - PR/progression/regression/same-load coloring
  - total session volume chart
  - front/back muscle map SVG
- Seed data copied from `legacy/original-dashboard.html` into `src/data/seed-workouts.json`
- Upload page at `/upload`
- OpenAI vision extraction API at `/api/extract-workout`
- Review/edit JSON page at `/review`
- Save-to-dashboard flow
- Browser localStorage persistence by default
- Optional Supabase persistence for real hosted DB usage
- Supabase SQL migration in `supabase/migrations/001_workout_sessions.sql`

## Quick start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open:

```txt
http://localhost:3000
```

The dashboard works immediately with demo data from the original HTML.

## AI extraction setup

Add this to `.env.local`:

```bash
OPENAI_API_KEY=sk-proj-your-key-here
OPENAI_MODEL=gpt-4.1-mini
```

Without `OPENAI_API_KEY`, the upload flow still works, but it returns a demo extraction so you can test the app UI.

## Optional Supabase DB setup

The app saves to browser localStorage even without a DB. To persist to Supabase:

1. Create a Supabase project.
2. Open the SQL editor.
3. Run `supabase/migrations/001_workout_sessions.sql`.
4. Add these env vars to `.env.local` and Vercel:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

The service role key is only used in server API routes. Do not expose it in client code.

## Deploy to Vercel

```bash
npm run build
```

Then import the repo into Vercel and add the same environment variables.

## How the data works

The dashboard expects this session shape:

```json
{
  "date": "2026-07-01",
  "muscle": "Back, Biceps",
  "satisfaction": 70,
  "notes": "optional",
  "type": "Self",
  "exercises": [
    { "name": "Lat Pulldown", "sets": [["12", "9"], ["10", "10"], ["8", "11"]] }
  ]
}
```

Weights are kept as strings so your original notations still work:

- `10x2`
- `Bar`
- `15(7+8)`
- `28,20`
- `-`

The dashboard parses the first numeric value for comparisons and volume calculations, while still displaying the original text.

## Important files

```txt
src/components/DashboardClient.tsx      main dashboard logic
src/components/BodyDiagram.tsx          SVG muscle map
src/components/VolumeChart.tsx          session volume chart
src/components/UploadClient.tsx         image upload UI
src/components/ReviewClient.tsx         review/save UI
src/app/api/extract-workout/route.ts    OpenAI vision extraction
src/app/api/sessions/route.ts           local/DB save API
src/lib/workout.ts                      PR, volume, parsing helpers
src/data/seed-workouts.json             original dashboard data
legacy/original-dashboard.html          original static HTML reference
```

## Next upgrades you can add

- Real auth with Clerk or Supabase Auth
- Multiple sessions on the same day
- Exercise aliases, e.g. `Lat Pullover` vs `Cable Pullover`
- Manual session entry form
- Export to CSV
- Editable muscle mapping UI
