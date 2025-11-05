# Code-Nexus Admin Dashboard

Simple read-only admin dashboard to view event registrations and analytics.

## Features

- ✅ Google Sign-In authentication (only `vstopensource@gmail.com` allowed)
- ✅ View all registrations for a single event
- ✅ View platform users list and stats
- ✅ Daily registrations chart and college distribution
- ✅ Export registrations and users (CSV/JSON)

## Setup (Local)

1. Start a local server (required for scripts):
   ```bash
   python3 -m http.server 8000
   ```
2. Open `http://localhost:8000/admin-login.html`
3. Sign in with Google using `vstopensource@gmail.com`

## Deploy to Netlify

1. Add your site on Netlify (connect repo or drag-n-drop the folder).
2. Build settings:
   - Build command: (leave empty)
   - Publish directory: `.`
3. We include `netlify.toml` to:
   - Redirect `/` to `/admin-login.html`
   - Add security headers
   - Cache static assets
4. In Firebase Console → Authentication → Settings → Authorized domains, add your Netlify domain, e.g. `your-site.netlify.app` and any custom domain.
5. After deploy, access `https://your-site.netlify.app/` → it redirects to the login page.

## Firestore Collections (expected)

- `event_registrations` (for event `gsoc-2024-10-31`)
- `users` (platform users)

## Notes

- If you change the event id, update `EVENT_ID` in `js/dashboard.js`.
- If Google sign-in popup is blocked, ensure the Netlify URL is whitelisted in Firebase Auth authorized domains.

