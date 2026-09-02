import { existsSync, readFileSync } from "node:fs";
const requiredFiles = ["package.json", "scripts/serve.mjs", "README.md", ".gitignore"];

for (const file of requiredFiles) {
  if (!existsSync(new URL(`../${file}`, import.meta.url))) {
    throw new Error(`Missing required file: ${file}`);
  }
}

const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
for (const script of ["start", "check", "test"]) {
  if (!packageJson.scripts?.[script]) {
    throw new Error(`Missing npm script: ${script}`);
  }
}

if (packageJson.scripts.test !== "node --test") {
  throw new Error("The test script must run Node's test discovery.");
}

console.log("Scaffold checks passed.");
