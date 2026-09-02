import { execFileSync } from "node:child_process";

for (const file of ["src/app.js", "src/timer.js", "scripts/serve.mjs"]) {
  execFileSync(process.execPath, ["--check", file], { stdio: "inherit" });
}

console.log("Syntax check passed.");
