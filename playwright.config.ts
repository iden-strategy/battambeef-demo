import { defineConfig, devices } from "@playwright/test";

// Browser checks for the shell and interaction kit. Dev tool only: never imported by app code.
// Run: npm run build && npm run test:e2e
// Most specs run against the production build (`next start`, port 3100). Two need a `next dev`
// server (port 3101) that Playwright starts as well: styleguide.spec.ts (the styleguide 404s on
// every deployment) and hydration.spec.ts (production React does not report hydration mismatches).
const PORT = 3100;
const DEV_PORT = 3101;
const PERF = /perf\.spec\.ts$/;
const DEV_ONLY = /(styleguide|hydration)\.spec\.ts$/;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    ...devices["Desktop Chrome"],
  },
  projects: [
    { name: "main", testIgnore: [PERF, DEV_ONLY] },
    // Dev server (styleguide and hydration specs): the first page compile is slow, so allow more
    // time per test. One worker: the dev server compiles on demand, and parallel browsers on it
    // made timing-based checks flaky.
    {
      name: "styleguide",
      testMatch: DEV_ONLY,
      timeout: 90_000,
      workers: 1,
      use: { baseURL: `http://localhost:${DEV_PORT}` },
    },
    // Timing-sensitive tests (perf.spec.ts): start only after "main" and "styleguide" have
    // finished, so they never share the machine with other browsers, whatever the worker count.
    // The file itself runs serially.
    // Note: if any test in those projects fails, Playwright skips this project (it depends on them).
    { name: "perf", testMatch: PERF, dependencies: ["main", "styleguide"] },
  ],
  webServer: [
    {
      command: `npx next start -p ${PORT}`,
      url: `http://localhost:${PORT}/robots.txt`,
      reuseExistingServer: true,
      timeout: 60_000,
    },
    {
      command: `npx next dev -p ${DEV_PORT}`,
      url: `http://localhost:${DEV_PORT}/en/styleguide`,
      reuseExistingServer: true,
      timeout: 180_000,
    },
  ],
});
