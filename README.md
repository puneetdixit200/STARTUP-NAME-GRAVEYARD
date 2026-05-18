# Startup Name Graveyard

A dark, satirical startup graveyard built with React, TypeScript, and Vite. It generates buzzword startup tombstones, Clearbit-style logos, fake metrics, eulogies, a VC ticker, leaderboards, custom burials, resurrection pivots, seasonal themes, and a real startup graveyard mode.

## Scripts

```bash
npm install
npm test
npm run lint
npm run build
npm run dev
```

## Deployment

The app is Vercel-ready as a static Vite site. Vercel should use:

- Build command: `npm run build`
- Output directory: `dist`

Third-party APIs are called client-side and have graceful fallbacks, so the app still works if an endpoint blocks CORS or is unavailable.
