// Creates .env from .env.example when it is missing, so `npm install` and
// `npm run ci` work from a clean clone (and on CI) with no manual step.
// An existing .env is never touched.
import { copyFileSync, existsSync } from "node:fs";

try {
  if (!existsSync(".env")) {
    copyFileSync(".env.example", ".env");
    console.log("Created .env from .env.example");
  }
} catch (error) {
  console.error("Could not create .env from .env.example:", error);
  process.exit(1);
}
