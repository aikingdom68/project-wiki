import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const installPath = path.join(repoRoot, "scripts", "install.mjs");
const sourceTestPrompts = path.join(repoRoot, "test-prompts.json");

function makeHome() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "project-wiki-home-"));
}

function runInstall(args, home) {
  return spawnSync(process.execPath, [installPath, ...args], {
    encoding: "utf8",
    env: {
      ...process.env,
      USERPROFILE: home,
      HOME: home,
    },
  });
}

test("install copies test-prompts.json into the target skill directory", () => {
  const home = makeHome();
  const result = runInstall([repoRoot, "--clean"], home);
  assert.equal(result.status, 0, result.stderr);

  const installedPath = path.join(
    home,
    ".claude",
    "skills",
    "project-wiki",
    "test-prompts.json",
  );

  assert.equal(fs.existsSync(installedPath), true);
  assert.equal(
    fs.readFileSync(installedPath, "utf8"),
    fs.readFileSync(sourceTestPrompts, "utf8"),
  );
});

test("install fails clearly when source test-prompts.json is missing", () => {
  const sourceRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "project-wiki-src-"),
  );
  fs.cpSync(repoRoot, sourceRoot, { recursive: true });
  fs.rmSync(path.join(sourceRoot, "test-prompts.json"));

  const home = makeHome();
  const result = runInstall([sourceRoot, "--clean"], home);
  assert.notEqual(result.status, 0, result.stdout);
  assert.match(result.stderr, /test-prompts\.json/i);
});
