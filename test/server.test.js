import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { join } from "node:path";
import { spawn } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = join(fileURLToPath(new URL("..", import.meta.url)), "");
const indexPath = join(root, "index.html");
const marker = "<h1>Server fixture</h1>";
const port = 31809;
let server;
let originalIndex;

function request(pathname) {
  return new Promise((resolve, reject) => {
    const request = require("node:http").get({ host: "127.0.0.1", port, path: pathname }, response => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", chunk => {
        body += chunk;
      });
      response.on("end", () => resolve({ body, response }));
    });
    request.on("error", reject);
  });
}

async function waitForServer() {
  let lastError;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      return await request("/");
    } catch (error) {
      lastError = error;
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
  throw lastError;
}

test.before(async () => {
  originalIndex = existsSync(indexPath) ? await readFile(indexPath) : null;
  await writeFile(indexPath, `<!doctype html>${marker}`);
  server = spawn(process.execPath, ["scripts/serve.mjs"], {
    cwd: root,
    env: { ...process.env, PORT: String(port) }
  });
  await waitForServer();
});

test.after(async () => {
  server.kill();
  await new Promise(resolve => server.once("exit", resolve));
  if (originalIndex === null) {
    await rm(indexPath);
  } else {
    await writeFile(indexPath, originalIndex);
  }
});

test("GET / serves index.html as HTML", async () => {
  const { body, response } = await request("/");

  assert.equal(response.statusCode, 200);
  assert.match(response.headers["content-type"], /^text\/html; charset=utf-8$/);
  assert.match(body, /Server fixture/);
});

test("encoded traversal is rejected", async () => {
  const { response } = await request("/%2e%2e%2fpackage.json");

  assert.equal(response.statusCode, 404);
});
