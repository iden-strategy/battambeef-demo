import { defineConfig, devices } from "@playwright/test";

// Browser checks for the shell and interaction kit. Dev tool only: never imported by app code.
// Run: npm run build && npm run test:e2e
const PORT = 3100;
const PERF = /perf\.spec\.ts$/;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    ...devices["Desktop Chrome"],
  },
  projects: [
    { name: "main", testIgnore: PERF },
    // Timing-sensitive tests (perf.spec.ts): start only after "main" has finished, so they never
    // share the machine with other browsers, whatever the worker count. The file itself runs serially.
    // Note: if any "main" test fails, Playwright skips this project (it depends on "main").
    { name: "perf", testMatch: PERF, dependencies: ["main"] },
  ],
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/robots.txt`,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
