# Budget Planner

A React, TypeScript and Vite budget planner with Supabase authentication and
per-user cloud-synced budget and profile data.

## Supabase setup

1. In the Supabase Dashboard, open **SQL Editor** and run
   [`supabase/schema.sql`](./supabase/schema.sql). This creates the `user_data`
   table and row-level security policies that restrict each account to its own
   budget and profile.
2. Set the project URL and publishable key in the project-root `.env.local`:

   ```dotenv
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-publishable-key
   ```

   Use the project URL shown in **Project Settings → API** (without `/rest/v1`)
   and the publishable key. Never put a `service_role` or secret key in a
   browser app.
   For a live deployment, add both variables in your hosting provider's
   environment-variable/build settings as well. `.env.local` is ignored by Git
   and is not uploaded when you push your code. Set them for the production
   environment, then trigger a fresh build and deployment.
3. In Resend, add and verify a sending domain and create an API key.
4. In Supabase, open **Authentication → SMTP Settings** (in some Dashboard
   versions this is under **Project Settings → Authentication → SMTP Settings**),
   enable custom SMTP, and enter:

   | Setting | Value |
   | --- | --- |
   | Sender email | An address on your verified Resend domain |
   | Sender name | Budget Planner |
   | Host | `smtp.resend.com` |
   | Port | `465` |
   | Username | `resend` |
   | Password | Your Resend API key |

   Keep the Resend API key in Supabase SMTP settings only. Do not add it to
   `.env.local` or frontend code.
5. In Supabase **Authentication → URL Configuration**, set the Site URL to
   your app URL and add both the local app URL (for example
   `http://localhost:5173`) and deployed URL to the allowed redirect URLs.
6. In **Authentication → Providers → Email**, enable email confirmations if
   you want new accounts to confirm their email before signing in.
7. Install dependencies and start the app:

   ```sh
   npm install
   npm run dev
   ```

Accounts are managed by Supabase Auth. Budgets and profiles are stored in the
`user_data` table and are synced across devices. Existing per-account data in
the browser is copied to Supabase the first time the corresponding Supabase
account signs in. Signup confirmation and password-reset messages are sent by
Supabase Auth through the configured Resend SMTP service. The app includes a
"Forgot your password?" flow and lets users set a new password from the emailed
recovery link.

## Install and offline use

The deployed app can be installed from the browser's **Install app** option.
After the app has been opened online at least once, its app shell and each
account's budget are cached on that device. Budgets can be viewed offline, and
changes saved while offline are kept on the device and synced to Supabase when
the connection returns. If that device and the cloud both changed the budget,
the offline device's saved budget takes precedence.
