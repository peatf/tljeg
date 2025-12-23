## DEV TICKET: Minification & Client-side Code Protection

Date: 2025-08-19

Summary
-------
Create a safe, repeatable production build process that minimizes bundle size, removes debug artifacts, and reduces exposure of source code while preserving the app's PWA behavior and debugging capabilities for owners (via private sourcemaps). This ticket outlines an audit, concrete Vite and CI changes, optional obfuscation, asset hosting recommendations, and verification steps.

Checklist (requirements extracted)
- [x] Produce a plan for minification.
- [x] Produce a plan for protecting client-side code (practical options and tradeoffs).
- [x] Tailor recommendations to the repo's stack (Vite + TypeScript + Tailwind + PWA + web/workers + models folder).
- [x] Save the plan as a Dev ticket under `docs/Updates`.

Context & constraints (repo-specific notes)
- Project uses Vite + TypeScript + Tailwind + PWA/service worker. See `vite.config.ts`, `postcss.config.cjs` and `tailwind.config.cjs`.
- There are local/packaged ML models under `models/` and a web worker at `src/lib/worker.ts` — these influence bundling and hosting decisions.
- Client-side code can be minified/obfuscated but cannot be fully "protected"; server-side migration is the only way to keep secrets/private logic completely hidden.

Contract (what success looks like)
- Inputs: existing source tree, current build scripts in `package.json`.
- Outputs: documented Vite build config recommendations, CI checks, and optional obfuscation step; a reproducible pipeline that produces a production build with smaller, sane bundles and non-public sourcemaps.
- Error modes: broken builds after aggressive mangle/obfuscation, source-map mismatches with deployed bundles, PWA cache issues.
- Success criteria: production build completes, bundles are smaller (target: reduced meaningful bytes; set a concrete size gate in CI), no public sourcemaps, service worker and PWA behavior preserved, and a regression test (smoke preview) passes.

Edge cases and risks
- Obfuscation can break code relying on function/class names (e.g., reflection, message passing between worker and window). Test thoroughly.
- Removing sourcemaps hurts debugging; prefer private sourcemap storage + upload to error-tracking (Sentry) rather than publishing maps.
- Large model files and binary assets won't shrink much with JS minifiers and may be better hosted on a CDN with auth.

High-level plan (phases)
1. Audit & measurement
   - Run a production build and generate a bundle report (visualizer). Identify largest chunks and third-party libraries that dominate size.
   - Record current gzipped sizes for main entries and service-worker precache list.

2. Baseline Vite build hardening (low risk)
   - Ensure `NODE_ENV=production` is defined for builds (Vite sets this automatically when using `vite build`, but make sure CI uses it).
   - Enable CSS purging (Tailwind `content` is already present — verify postcss/tailwind build step strips unused classes).
   - Remove dev-only code via conditional checks (wrap debug-only code with `if (import.meta.env.DEV)` and rely on dead-code elimination in production).

3. Configure advanced minification (recommended)
   - Switch to Terser for production minification if more control is needed (Vite defaults to esbuild which is faster but has fewer options). Example in `vite.config.ts`:

```ts
// (example - add to existing vite.config.ts build section)
export default defineConfig({
  // ...existing config...
  build: {
    minify: 'terser', // alternative: 'esbuild' for speed
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
      format: {
        comments: false,
      },
      mangle: {
        // Be careful with properties mangle if code relies on names across boundaries
      }
    },
    sourcemap: false // use private sourcemap workflow instead of publishing maps
  }
})
```

   - Keep `sourcemap: false` for public artifacts. If you need mapping for error reports, generate sourcemaps during CI, archive them as build artifacts or upload them directly to Sentry and do not publish them publicly.

4. Private sourcemap strategy (recommended)
   - In CI, build with `build.sourcemap = true` but do not ship these maps to the CDN; instead, upload to Sentry or store them in a private artifact bucket.
   - Use Sentry's release + sourcemap upload or a private S3 with tight permissions.

5. Static asset / model hosting policy
   - Move large models in `models/` or heavy binary assets to an authenticated CDN or server endpoint if you need access control.
   - If models must be shipped with the app, keep them as separate resources (not inlined) with cache-control immutable headers and prefer compressed binary formats.

6. Optional code obfuscation (tradeoffs)
   - Tools: `javascript-obfuscator` (CLI) run as a post-build pass or via a Rollup plugin.
   - Tradeoffs: obfuscation increases size, can break reflection or worker-message patterns, and complicates debugging. Treat obfuscation as an additional layer (not a replacement for server-side protection).
   - If using obfuscation prefer a targeted approach: obfuscate only non-framework app code (e.g., `src/` bundle) and avoid obfuscating third-party libs or worker interfaces.

7. CI / automation
   - Add a job (CI) that runs production build, generates a bundle visualizer HTML artifact, and compares sizes to a threshold. Fail the build if thresholds are exceeded.
   - Example checks: main entry < 250 KB gzipped (adjust to your app's baseline), total JS < 1 MB gzipped, or no increase > 10% vs last release.
   - Upload private sourcemap artifact and/or send to Sentry as part of the release step.

8. Service worker & caching
   - Ensure service-worker precache manifest refers to hashed, minified files (Vite's build produces hashed filenames). Do not cache un-hashed dev files.
   - On deploy, set cache-control headers: `Cache-Control: public, max-age=31536000, immutable` for hashed assets. Service worker should use revisioned assets so new releases trigger updates.

9. Verification and tests
   - Smoke test: run `vite preview` on the built output and verify main flows, PWA install, and offline behavior.
   - Run unit/CI tests that focus on worker communication and any reflect/metadata-dependent code paths (obfuscation risk zone).
   - Manual QA pass after obfuscation to test interaction surfaces (workers, postMessage payloads, analytics hooks, etc.).

Implementation tasks (suggested PRs & effort)
- PR 1 (Audit + Analyzer) — add `rollup-plugin-visualizer` or `vite-plugin-bundle-visualizer`, run and attach report (2-4h)
- PR 2 (Vite build hardening) — set `terser` options, drop console/debugger, disable public sourcemaps; add CI build step to produce private sourcemaps (2-6h)
- PR 3 (CI size gating + sourcemap upload) — add/extend CI to fail on oversize, upload sourcemaps to Sentry or private storage (2-4h)
- PR 4 (Optional) Obfuscation pass — prototype with `javascript-obfuscator` on a staging build and run full QA (4-8h)
- PR 5 (Assets & models) — host large models on CDN/secured endpoint and update app to fetch them remotely (variable, medium-high effort)

Quick implementation notes/snippets
- Add visualizer plugin:

```ts
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  // ...
  plugins: [
    // ...existing plugins...
    visualizer({ filename: 'dist/stats.html' })
  ]
})
```

- Example CI workflow excerpt (pseudo):

```yaml
jobs:
  build:
    steps:
      - run: npm ci
      - run: npm run build --if-present
      - run: node ./scripts/collect-sizes.js # produce size report
      - run: pnpm run upload-sourcemaps || true # optional
```

Notes, tradeoffs, and recommendations
- Do not treat obfuscation as a security boundary — determined attackers can still reverse engineer client code. Use server-side endpoints for any private logic or secrets.
- Prefer private sourcemaps + monitored error reporting (Sentry) over shipping source maps publicly.
- Prioritize bundle analysis: often a small set of libraries causes most of the weight (e.g., big UI libs or heavy util libs). Replacing or lazy-loading them can yield more wins than aggressive minification.

Next steps (short-term)
1. Add a bundle visualizer and run one production build to collect baseline sizes (PR1).
2. Apply non-destructive build changes (drop console, disable public sourcemaps) and add CI job to produce private sourcemaps (PR2 + PR3).
3. Evaluate obfuscation only if attacker risk justifies the downsides; run a separate QA against the obfuscated build (PR4).

Requirements coverage
- Plan for minification: Done.
- Plan for code protection: Done (practical options + tradeoffs, obfuscation and hosting suggestions).
- Based on current codebase: Done (notes on Vite/TS/Tailwind/PWA, workers, models folder).
- Saved under `docs/Updates`: Done (this file).

If you want, I can now:
- Create the PR that adds `rollup-plugin-visualizer` and uploads the HTML to the CI artifacts folder, or
- Draft the exact `vite.config.ts` edits for your repo and run a local build to capture baseline sizes.

— End of ticket
