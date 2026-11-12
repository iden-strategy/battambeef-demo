import { defineConfig, devices } from "@playwright/test";

// Browser checks for the shell and interaction kit. Dev tool only: never imported by app code.
// Run: npm run build && npm run test:e2e
// Most specs run against the production build (`next start`, port 3100). The styleguide is
// development-only (it 404s on every deployment), so styleguide.spec.ts runs against a
// `next dev` server (port 3101) that Playwright starts as well.
const PORT = 3100;
const DEV_PORT = 3101;
const PERF = /perf\.spec\.ts$/;
const STYLEGUIDE = /styleguide\.spec\.ts$/;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    ...devices["Desktop Chrome"],
  },
  projects: [
    { name: "main", testIgnore: [PERF, STYLEGUIDE] },
    // Dev server: the first page compile is slow, so allow more time per test.
    {
      name: "styleguide",
      testMatch: STYLEGUIDE,
      timeout: 90_000,
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
