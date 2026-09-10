# JOBTRAK

An Opportunity Dashboard — local-first single-page app for tracking freelance, contract, consulting, and full-time opportunities. All data stays in your browser (localStorage).

## Run locally

Open `index.html` in a browser, or serve the folder with any static server:

```bash
python3 -m http.server 8080
```

Then visit http://localhost:8080

## Deploy (GitHub Pages)

Pushes to `main` deploy automatically via GitHub Actions.

### One-time GitHub setup

1. Sign in to GitHub CLI (if you have not already):

```bash
gh auth login
```

2. Create the repo, push, and enable Pages:

```bash
./scripts/setup-github.sh
```

By default the repo name is `job-search`. Pass a different name if you prefer:

```bash
./scripts/setup-github.sh my-repo-name
```

After the first deploy completes, the site will be at:

`https://<your-github-username>.github.io/job-search/`

## Files

- `index.html` — app shell
- `styles.css` — design system
- `data.js` — constants and seed data
- `app.js` — application logic
- `backups/` — local JSON exports (gitignored; keep your own copies)

## Data

Your live data is stored in the browser under the key `jobtrak_data_v1`. Use **Settings → Export JSON Backup** periodically. Import from **Settings → Choose File**.

Exported backups in `backups/` are not committed to git because they may contain personal information.
