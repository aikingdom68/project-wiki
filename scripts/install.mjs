#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
let srcArg = ".";
let force = false;
let clean = false;
let dryRun = false;

for (const arg of args) {
  if (arg === "--force") force = true;
  else if (arg === "--clean") clean = true;
  else if (arg === "--dry-run") dryRun = true;
  else srcArg = arg;
}

const src = path.resolve(srcArg);
const home = process.env.USERPROFILE || process.env.HOME;
if (!home) {
  console.error("Unable to determine home directory");
  process.exit(1);
}
const dst = path.join(home, ".claude", "skills", "project-wiki");

const whitelist = [
  "SKILL.md",
  "README.md",
  "README.zh-CN.md",
  "LICENSE",
  "CHANGELOG.md",
  "RELEASE.md",
  "PUBLISHING.md",
  "ROADMAP.md",
  "test-prompts.json",
  "contracts",
  "references",
  "examples",
  "scripts",
  "evals",
];

function assertFileExists(rel) {
  const p = path.join(src, rel);
  if (!fs.existsSync(p)) {
    console.error(`Missing required source path: ${rel}`);
    process.exit(1);
  }
}

function ensureSafe(source) {
  const stat = fs.lstatSync(source);
  if (stat.isSymbolicLink()) {
    throw new Error(
      `Symbolic links are not supported during install: ${source}`,
    );
  }
  return stat;
}

function copyRecursive(source, target) {
  const stat = ensureSafe(source);
  if (stat.isDirectory()) {
    fs.mkdirSync(target, { recursive: true });
    for (const entry of fs.readdirSync(source)) {
      copyRecursive(path.join(source, entry), path.join(target, entry));
    }
  } else {
    fs.copyFileSync(source, target);
  }
}

assertFileExists("SKILL.md");
assertFileExists("README.md");
assertFileExists("README.zh-CN.md");
assertFileExists("LICENSE");
assertFileExists("CHANGELOG.md");
assertFileExists("RELEASE.md");
assertFileExists("PUBLISHING.md");
assertFileExists("ROADMAP.md");
assertFileExists("test-prompts.json");
assertFileExists("contracts");
assertFileExists("references");
assertFileExists("examples");
assertFileExists("scripts");
assertFileExists("evals");

if (path.resolve(src) === path.resolve(dst)) {
  console.error("Source and destination are the same path; aborting.");
  process.exit(1);
}

const dstExists = fs.existsSync(dst);
const dstNonEmpty = dstExists && fs.readdirSync(dst).length > 0;
if (dstNonEmpty && !force && !clean) {
  console.error(
    `Destination already exists and is non-empty: ${dst}\nUse --force to overwrite or --clean to replace it.`,
  );
  process.exit(1);
}

if (dstExists) {
  const dstStat = fs.lstatSync(dst);
  if (dstStat.isSymbolicLink()) {
    console.error("Destination path must not be a symbolic link.");
    process.exit(1);
  }
}

if (dryRun) {
  console.log(`Would install project-wiki from ${src} to ${dst}`);
  console.log(`Included items: ${whitelist.join(", ")}`);
  process.exit(0);
}

if (clean && dstExists) {
  fs.rmSync(dst, { recursive: true, force: true });
}

fs.mkdirSync(dst, { recursive: true });
for (const entry of whitelist) {
  const source = path.join(src, entry);
  if (!fs.existsSync(source)) continue;
  copyRecursive(source, path.join(dst, entry));
}

console.log(`Installed project-wiki to ${dst}`);
