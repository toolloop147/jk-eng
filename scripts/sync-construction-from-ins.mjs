import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const engRoot = path.resolve(__dirname, "..");
const insRoot = path.resolve(engRoot, "..", "jk-ins");

const insGlobals = fs
  .readFileSync(path.join(insRoot, "frontend/src/app/globals.css"), "utf8")
  .split(/\r?\n/);

const css = [...insGlobals.slice(50, 1506), "", ...insGlobals.slice(1736, 1794)].join(
  "\n",
);

fs.writeFileSync(
  path.join(engRoot, "frontend/public/construction-manage.css"),
  `${css}\n`,
);

const installFiles = [
  "ConstructionManagePage.tsx",
  "InstallConfirmationForm.tsx",
  "CompletionConfirmationForm.tsx",
];

for (const file of installFiles) {
  const source = fs.readFileSync(
    path.join(insRoot, `frontend/src/components/install/${file}`),
    "utf8",
  );
  const adapted = source
    .replaceAll('from "@/lib/api"', 'from "@/lib/insApi"')
    .replaceAll("from '@/lib/api'", "from '@/lib/insApi'");
  fs.writeFileSync(
    path.join(engRoot, `frontend/src/components/install/${file}`),
    adapted,
  );
}

console.log("Synced construction-manage assets from jk-ins");
