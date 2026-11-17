import os from "node:os";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

const PORT = 3150;

// The dev server gets its own JSON backend file in the OS temp dir (it does not exist
// yet, so db.ts seeds it from src/lib/seed-data.ts). data/db.json is never touched.
const jsonDbPath = path.join(os.tmpdir(), `atlas-tours-e2e-${Date.now()}`, "db.json");

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run dev -- -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: { JSON_DB_PATH: jsonDbPath, DATABASE_URL: "" },
  },
});
