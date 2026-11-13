# GharLedger

GharLedger is a responsive household staff, attendance and payroll workspace. The UI supports a local demo and Supabase sign-in with household-scoped API sync. Staff service pay rates and monthly absence allowances can be set individually.

## Run locally

1. Install Node.js 20 or newer.
2. Copy `.env.example` to `.env` and add Supabase project URL, anon key and service role key.
3. Run `npm install`, then `npm run dev`.
4. Open the Vite URL shown in the terminal. The current UI can be explored without Supabase credentials; demo records stay in that browser's local storage.

Use `npm test` for the payroll engine cases and `npm run build` for the production frontend bundle.

## Supabase setup

Run `supabase/migrations/001_initial_schema.sql` then `supabase/migrations/002_staff_service_pay_rates.sql` and `supabase/migrations/003_service_absence_allowances.sql` in the Supabase SQL editor. Together they create the application tables, constraints, indexes, profile bootstrap trigger, household RLS policies and per-staff service salary overrides. Keep `SUPABASE_SERVICE_ROLE_KEY` on the server only. The Express API verifies the caller's Supabase access token and scopes database reads and writes to that user.

## Deploy

The Vite frontend and Express API are configured for Vercel with `vercel.json`. Add the environment variables from `.env.example` in Vercel and configure the same secrets for local server development. Apply all three migrations before using the app.

## Install GharLedger as an app

The Vite build generates the PWA manifest and service worker. Run `npm install` and `npm run build`; deploy the contents of `dist` through the existing Vercel project. Vercel serves the app over HTTPS, which is required for service workers outside localhost. Service worker updates are applied automatically. It precaches only the static app shell and assets; API routes and private responses are not cached.

- **Android:** Open the deployed HTTPS site in Chrome and tap **Install app** (or **Add to Home screen**) when offered.
- **Desktop Chrome or Edge:** Open the deployed site and choose **Install app** from GharLedger or the browser's install control.
- **iPhone/iPad:** Open the deployed site in Safari, tap **Share**, choose **Add to Home Screen**, then tap **Add**. GharLedger provides these steps from its Install app button.

To regenerate the bundled house icons, run `npm run icons:generate`.

## Payroll rules

- Cooking: ₹4,500 base, ₹50 for each missed breakfast, lunch or dinner.
- Cleaning: ₹500 base; the first two absent days per worker each month are protected, then ₹500 / 30 is deducted per day.
- Cooking: the first six missed meals per worker per month are protected in any meal combination. Meals on paid holidays count toward those six; each missed meal after the allowance deducts the configured rate.
- Cooking allowance and cleaning allowance are independent; paid holiday dates count as three cooking misses and one cleaning absence.
- Unmarked attendance does not create deductions. Weekly and special holidays are skipped.
- Only approved extra work is included. Advances reduce payable, bonuses and other adjustments increase it, and payment balance is calculated separately.
- Finalized salary records use versioned snapshots; later recalculation creates a new version.
