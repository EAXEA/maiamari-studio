import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Next.js .env.local'ı kullan
config({ path: ".env.local" });

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
