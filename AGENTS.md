# Agent Notes

## Deployment

This repo auto-deploys via GitHub Actions on every push to `main`. However, the `Production CI` workflow is defined in `.github/workflows/deploy-production.yml` and triggers on `push: branches: [main]`. If the workflow does not appear to run after a push:

1. Check `gh run list --repo drhycheung/OATutor --workflow "Production CI" --limit 5`
2. If no run was triggered, manually dispatch: `gh workflow run "Production CI" --repo drhycheung/OATutor --ref main`
3. Wait for it to complete: `gh run list --repo drhycheung/OATutor --workflow "Production CI" --limit 1`
4. After the CI run succeeds, a `pages-build-deployment` run will fire automatically to publish to GitHub Pages.

**After committing and pushing, always trigger/verify the deploy workflow.** Do not assume the push alone will deploy successfully — check the run status.

## Build

```sh
npx react-app-rewired build
```

The prebuild step (`node src/tools/preprocessProblemPool.js`) generates the content pool JSON into `generated/processed-content-pool/`.

## Key conventions

- URLs use course codes (e.g. `/courses/psy2032`), not numeric indices.
- The `courseCode` field in `coursePlans.json` maps to the URL param.
- Dark glassmorphism theme throughout — use slate/teal colour palette, not the upstream light theme.
- British English spelling in all user-facing text and documentation.
