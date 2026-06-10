import { copyFileSync, existsSync } from "node:fs";

const pairs = [
  ["backend/.env.example", "backend/.env"],
  ["frontend/.env.example", "frontend/.env.local"],
];

for (const [from, to] of pairs) {
  if (!existsSync(to) && existsSync(from)) {
    copyFileSync(from, to);
    console.log(`[setup] created ${to}`);
  }
}
