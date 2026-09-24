# Porting OATutor to Your Own Firebase Account

This guide explains how to connect this fork to a **Firebase project you own**, so students can sign in with Google and have their progress synced across devices. The system remains fully functional *without* Firebase — it simply falls back to local-only storage.

> **Do you need this?** If you never touch Firebase, the app behaves exactly as before: progress is stored locally in the browser (`localforage`/IndexedDB). The Google login button is only shown, and Firestore sync only happens, when a **real Firebase web config** is provided.

---

## How progress persistence works

| Situation | What happens |
|---|---|
| Signed out (no Firebase, or logged out) | Progress is read/written to local browser storage only. No network calls. |
| Signed in with Google | On every progress write the new value is mirrored to Firestore; on sign-in the local cache is merged/restored from Firestore. |
| No Firebase configured | `initializeFirebaseApp()` returns `null` → auth is disabled → local-only behaviour. Safe to deploy without any config. |

Storage is keyed per user: progress written while signed in lives under owner-scoped keys (suffixed with the Firebase UID), separate from anonymous local keys. Anonymous progress is migrated up on the first-ever sign-in.

---

## Part A — Create a Firebase project

1. Go to <https://console.firebase.google.com> and sign in with a Google account you control (this becomes the project owner).
2. **Add project**, name it (e.g. `oatutor`), disable Google Analytics if you don't need it. Wait for it to provision.

## Part B — Enable Google sign-in

1. In the Firebase Console left menu: **Authentication → Get started** → **Sign-in method** tab.
2. Click **Google** → toggle **Enable** → pick your support email → **Save**.
3. Under **Authorized domains** (Settings tab) you will see `localhost`. **Add your GitHub Pages domain**, e.g. `drhycheung.github.io` (or `<your-org>.github.io`). This is required for sign-in to work from the deployed site.

## Part C — Create the Firestore database and deploy rules

1. **Build → Firestore Database → Create database**.
2. Choose **Production mode** (locked rules) and a location, e.g. `asia-east2`.
3. Deploy the rules from this repo (`firestore.rules` + `firebase.json`). You can either:
   - **CLI:** `npm i -g firebase-tools`, then `firebase login`, `firebase use --add <your-project-id>`, `firebase deploy --only firestore:rules`; or
   - **Console:** open the **Rules** tab and paste the contents of `firestore.rules`, then **Publish**.

   The key rule protecting student data: `users/{owner}` is readable/writable **only** by the signed-in user whose UID matches the document ID.

## Part D — Register your web app and encode the config

1. In the console: **Project settings (gear) → Your apps → Add app → Web** (`</>`). Nickname it (e.g. `oatutor-web`) and register (leave Firebase Hosting unticked).
2. Copy the generated **firebaseConfig** object — it looks like:

   ```js
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project",
     storageBucket: "your-project.firebasestorage.app",
     messagingSenderId: "123456789",
     appId: "1:...:web:...",
     measurementId: "G-..."
   };
   ```

3. **Base64-encode** the JSON. Easiest: open a browser console on any page and run:

   ```js
   btoa(JSON.stringify({ apiKey: "AIza...", authDomain: "...", projectId: "...", storageBucket: "...", messagingSenderId: "...", appId: "...", measurementId: "..." }))
   ```

   Copy the long base64 string — you will use it for local dev *and* as the deploy secret.

## Part E — Local development

1. Open `.env` (next to this file) and set:

   ```
   REACT_APP_ENABLE_GOOGLE_AUTH=true
   REACT_APP_ENABLE_REMOTE_PROGRESS=true
   REACT_APP_FIREBASE_CONFIG=<your-base64-string>
   ```

2. `npm install` then `npm run start`. The dev server runs on port 1377.
3. Sign out, answer a problem (local progress), sign in with Google — progress should appear in Firestore under `users/<your-uid>`.

> `.env` is in `.gitignore`, but in this repo it was historically committed. See "Avoid leaking keys" below before pushing.

## Part F — Deployment on GitHub Pages

The `deploy-production.yml` workflow builds with the config injected from a GitHub secret — it never reads `.env`.

1. In the repo: **Settings → Secrets and variables → Actions → New repository secret**.
2. **Name:** `FIREBASE_CONFIG` — **Value:** your base64 string from Part D. **Add secret**.
3. Push to `main`. The workflow builds, embeds the config, and deploys to the `gh-pages` branch.

No other secrets are needed. The workflow's own admin credentials (`secrets.OATUTOR_JSON_KEY`, if present) are written to the runner at build time only and never into the built bundle.

## Verifying it worked

- **Deployment:** the page shows the "Log in with Google" button (the button only renders when a real config exists).
- **Round-trip:** sign in → finish a problem → in the Firebase Console check `Firestore → users/<uid>`; the `progress` map should contain the mastery entry. Open the site in a private/incognito window and sign in again — mastery should be restored.

---

## Security notes (read before pushing)

- **The Firebase web `apiKey` is not a secret.** It is a public client identifier, embedded in every web build by design. Data protection comes from **Firestore Security Rules**, not from hiding the key. As long as `firestore.rules` is deployed, other users cannot read `users/` documents.
- **Never commit service-account keys.** Files like `serviceAccountKey.json`, `oatutor-firebase-adminsdk.json`, or base64 admin JSON (`OATUTOR_JSON_KEY`) stay out of git. They are listed in `.gitignore` already. Only the GitHub Actions *secret* stores them.
- **Keep raw config out of git where possible.** Although the web config is public, it is cleaner to keep it only in the GitHub secret and your local `.env`. If your `.env` is tracked (this repo's history includes it), run `git rm --cached .env` so future edits aren't diffed/pushed; git still creates a local copy for dev.
- **Rotate if needed.** You can regenerate/restrict the `API key` in Firebase Console → Project settings → API keys if you ever suspect misuse (restricting to your domains/HTTP referrers is recommended).