# Enabling Google Login

The button is already wired into the login and register pages. It activates as soon as three environment variables are set. Until then the site runs fully on email/password accounts.

## 1. Create Google OAuth credentials

1. Go to https://console.cloud.google.com/apis/credentials
2. Create a project (or pick an existing one)
3. Configure the OAuth consent screen (External, fill in app name and support email)
4. Create credentials -> OAuth client ID -> Web application
5. Add an authorized redirect URI:
   - Local: `http://localhost:3000/auth/google/callback`
   - Production: `https://your-domain.com/auth/google/callback`

## 2. Set the environment variables

```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=https://your-domain.com/auth/google/callback
```

On Render: Dashboard -> your service -> Environment -> Add each variable, then redeploy.

## 3. Restart and test

Open /login and click "Continue with Google". First-time users get an account created automatically; returning Google users are matched to their existing account by email.

## Notes

- The redirect URI in Google Cloud must match `GOOGLE_CALLBACK_URL` exactly (https, no trailing slash).
- Google accounts are stored with `provider: "google"` in the Users admin page. Admins can promote a Google user to admin from there.
- If the OAuth consent screen is in "Testing" mode, add each user's Gmail under Test users, or publish the app.
