# Supabase setup for VDuckiee

The website is static on GitHub Pages. Supabase supplies Google login, the
Postgres table, and Row Level Security (RLS); no separate application server is
required.

## 1. Create the Supabase project

1. Open <https://supabase.com/dashboard> and choose **New project**.
2. Select an organization, use a name such as `vduckie-chinese`, choose the
   Free plan, and select a nearby region (Singapore is normally suitable for
   Vietnam).
3. Create and securely store the database password. Do not put it in GitHub or
   send it to a developer.
4. Wait until the project status is healthy.

Open the project's **Connect** panel and copy:

- **Project URL**, for example `https://abcdefgh.supabase.co`
- **Publishable key**, beginning with `sb_publishable_`

If those values are not shown in Connect, open **Project Settings > API Keys**
for the publishable key and **Project Settings > Data API** for the URL. A
legacy `anon public` key also works. Never copy a Secret key, `service_role`
key, database password, or Google Client Secret into frontend code.

## 2. Create the table and RLS policies

1. In Supabase, open **SQL Editor > New query**.
2. Copy all of [`supabase/schema.sql`](./supabase/schema.sql) into the editor.
3. Choose **Run**. The script is safe to run again while setting up the project.

The script creates `public.user_words`, enables RLS, removes anonymous access,
and adds separate SELECT, INSERT, UPDATE, and DELETE policies. Each policy
requires `auth.uid() = user_id`, so an authenticated student can only access
their own rows.

## 3. Configure Google login

### Google Auth Platform

1. Open <https://console.cloud.google.com/auth/clients> and select or create a
   Google Cloud project.
2. Configure the OAuth consent screen. While the app is in Testing, add the
   Google accounts that will test the site.
3. Create an **OAuth client ID** with application type **Web application**.
4. Add this Authorized JavaScript origin (origin only, without the repository
   path):

   `https://ducnguyen138cyber.github.io`

5. In Supabase, open **Authentication > Sign In / Providers > Google** and copy
   the callback URL shown there. It normally looks like:

   `https://PROJECT_REF.supabase.co/auth/v1/callback`

6. Add that exact callback under Google's **Authorized redirect URIs**.
7. Copy the Google Client ID and Client Secret into the Supabase Google provider
   form, enable the provider, and save. The secret stays only in Google and
   Supabase dashboards.

### Supabase URL configuration

Open **Authentication > URL Configuration** and set:

- **Site URL**:
  `https://ducnguyen138cyber.github.io/erp-tieng-trung-vduckiee/`
- **Redirect URLs**: add the same exact URL.

For local testing, optionally add `http://localhost:4173/**` to Redirect URLs.
Use the exact production URL rather than a wildcard for GitHub Pages.

## 4. Add the public browser configuration

Edit [`supabase-config.js`](./supabase-config.js):

```js
window.VDUCKIE_SUPABASE_CONFIG = Object.freeze({
  url: "https://PROJECT_REF.supabase.co",
  publishableKey: "sb_publishable_REPLACE_ME",
  redirectUrl: "https://ducnguyen138cyber.github.io/erp-tieng-trung-vduckiee/"
});
```

Only the Project URL and publishable/anon key belong in this file. Security is
enforced by the user's Supabase session and RLS, not by hiding the publishable
key.

## 5. Test before deployment

From the repository root:

```bash
python3 -m http.server 4173
```

Open `http://localhost:4173/?area=erp`, then verify:

1. **Đăng nhập Google** returns to the website and shows the account name.
2. **Đã nhớ** creates or updates a row with `is_known = true`.
3. **Học lại** updates the same row to `is_known = false`.
4. **Lưu vào sổ từ** or **+ Lưu** creates or updates `is_saved = true`.
5. Deleting a saved word updates `is_saved = false`.
6. Sign in with a second test account. Its SELECT result must not expose rows
   belonging to the first account.
7. Turn the network off, change a word, turn it back on, and confirm the status
   changes from waiting to **Đã đồng bộ**.

LocalStorage remains the offline-first copy. On login, the site merges it with
Supabase using timestamps for the learned and saved flags, then pushes the
resolved state back to the RLS-protected row.
