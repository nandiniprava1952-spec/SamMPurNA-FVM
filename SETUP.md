# SamMPurna Field Visit Monitoring: State/District PWA

## Files
| File | Goes where |
|---|---|
| `index.html`, `sw.js`, `manifest.webmanifest`, `icons/` | GitHub Pages repo root (all four together) |
| `backend/Code.gs` | Google Apps Script (bound to a Google Sheet). No password in it. |
| `users_import.csv` (separate download) | Imported into the Sheet as the `Users` tab: the State login + 30 district logins (hashes only) |
| `district_logins_PRIVATE.csv` (separate download) | The passwords. Keep private, never commit. |
| `seed_DO_NOT_PUBLISH/seed_visits.csv` | Your existing 44,581 visits, to upload once from the Admin tab. Never commit to a public repo. |

## 1. Backend (no setup step)
1. New Google Sheet (keep it private) → **Extensions → Apps Script** → paste `Code.gs`.
2. **Deploy → New deployment → Web app** · Execute as **Me** · Access **Anyone** → authorise when asked → copy the `/exec` URL.
3. In the Sheet: **File → Import → Upload** `users_import.csv`.
   - Import location: **Insert new sheet(s)**, and untick **Convert text to numbers, dates and formulas**.
   - Rename the new tab to exactly **`Users`**.
   - (If a `Users` tab already exists because the URL was opened first: select that tab and choose **Replace current sheet** instead.)

The other tabs (Visits, Staging, Log) and the secret key are created automatically on first use.
After any later edit of `Code.gs`: **Deploy → Manage deployments → Edit → New version**.

## 2. Front end
1. In `index.html`, set `API_URL` to the `/exec` URL.
2. Push the four items above to GitHub Pages.
3. Open the site → sign in as `state` with the password from `district_logins_PRIVATE.csv`.

## 3. First use
1. **Admin → Choose CSV/XLSX →** `seed_visits.csv` → **Replace all cloud data**.
2. Give each district its own row from `district_logins_PRIVATE.csv` (username + password + the site URL). Then delete the file. Everyone can still change their own password with the **Password** button.
3. Install: Android/desktop Chrome shows **Install**; iPhone: Share → Add to Home Screen.
4. Later: **Admin → Users** to add, reset or deactivate logins. **Create logins for all districts** only adds districts that have none (those get a temporary password they must change).

## Roles
| | State | District |
|---|---|---|
| Data received | all districts | only their district (filtered on the server) |
| Tabs | Overview, District/Block matrix, Monitors, **Admin** | Overview, Block matrix, Monitors |
| Upload / manage users | yes | no |

## Releases
Edit files, bump `VERSION` in `sw.js`, push. Open apps show "A new version is ready, Reload".

## Known limits
- Sign-in needs internet. After that the app opens offline from the device copy and re-syncs when online.
- Sessions last 7 days (`TOKEN_HOURS`). Changing a password or deactivating a user ends their sessions.
- The device keeps a copy of that user's data until they tap **Sign out**.
- Two admins uploading at the same moment can mix chunks; upload one at a time.
- If every State password is lost: in the Sheet's `Users` tab delete all rows below the header and re-import `users_import.csv`.
