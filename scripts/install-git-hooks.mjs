import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

try {
  execSync("git rev-parse --git-dir", { cwd: root, stdio: "ignore" });
} catch {
  console.log("[hooks] skipped (not a git repository)");
  process.exit(0);
}

execSync("git config core.hooksPath scripts/git-hooks", { cwd: root, stdio: "inherit" });
console.log("[hooks] installed — post-merge will run db:migrate when init SQL changes");
