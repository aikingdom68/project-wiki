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
const healthcheckPath = path.join(repoRoot, "scripts", "healthcheck.mjs");

function makeProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "project-wiki-target-"));
}

function runHealthcheck(projectRoot) {
  const result = spawnSync(process.execPath, [healthcheckPath, projectRoot], {
    encoding: "utf8",
  });
  const parsed = result.stdout ? JSON.parse(result.stdout) : null;
  return { ...result, parsed };
}

function writeConfig(projectRoot, config) {
  const configDir = path.join(projectRoot, ".project-wiki");
  fs.mkdirSync(configDir, { recursive: true });
  fs.writeFileSync(
    path.join(configDir, "project-wiki.config.json"),
    JSON.stringify(config, null, 2),
  );
}

function trySymlink(target, linkPath, type) {
  try {
    fs.symlinkSync(target, linkPath, type);
    return true;
  } catch (error) {
    if (error.code === "EPERM" || error.code === "EACCES") {
      return false;
    }
    throw error;
  }
}

test("healthcheck reports missing binding without creating files", () => {
  const projectRoot = makeProject();
  const beforeEntries = fs.readdirSync(projectRoot);

  const result = runHealthcheck(projectRoot);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.parsed.status, "needs_binding");
  assert.equal(result.parsed.projectRoot, path.resolve(projectRoot));
  assert.equal(result.parsed.config.exists, false);
  assert.equal(result.parsed.readOnly, true);
  assert.deepEqual(fs.readdirSync(projectRoot), beforeEntries);
});

test("healthcheck reports configured roots and missing optional paths", () => {
  const projectRoot = makeProject();
  fs.mkdirSync(path.join(projectRoot, "docs"));
  fs.mkdirSync(path.join(projectRoot, ".project-wiki", "wiki"), {
    recursive: true,
  });
  writeConfig(projectRoot, {
    version: 1,
    projectType: "document-corpus",
    projectRoot: ".",
    wikiRoot: ".project-wiki/wiki",
    adminRoot: ".project-wiki/admin",
    rawSourceRoots: ["docs", "missing-sources"],
    writeWhitelist: [".project-wiki/wiki/**"],
  });

  const result = runHealthcheck(projectRoot);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.parsed.status, "configured_with_warnings");
  assert.equal(result.parsed.config.exists, true);
  assert.equal(result.parsed.projectType.value, "document-corpus");
  assert.equal(result.parsed.paths.wikiRoot.exists, true);
  assert.equal(result.parsed.paths.adminRoot.exists, false);
  assert.deepEqual(result.parsed.rawSourceRoots, [
    { path: "docs", exists: true, valid: true },
    { path: "missing-sources", exists: false, valid: true },
  ]);
  assert.equal(result.parsed.writeWhitelist.empty, false);
});

test("healthcheck rejects configured paths outside project root", () => {
  const projectRoot = makeProject();
  writeConfig(projectRoot, {
    version: 1,
    projectType: "document-corpus",
    wikiRoot: "../outside",
    adminRoot: ".project-wiki/admin",
    rawSourceRoots: ["docs"],
    writeWhitelist: [".project-wiki/wiki/**"],
  });

  const result = runHealthcheck(projectRoot);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /CONFIG_PATH_OUTSIDE_PROJECT/);
});

test("healthcheck rejects non-string configured path values", () => {
  const projectRoot = makeProject();
  writeConfig(projectRoot, {
    version: 1,
    projectType: "document-corpus",
    wikiRoot: 42,
    rawSourceRoots: ["docs"],
    writeWhitelist: [".project-wiki/wiki/**"],
  });

  const result = runHealthcheck(projectRoot);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /CONFIG_PATH_INVALID_TYPE/);
});

test("healthcheck rejects write whitelist paths outside project root", () => {
  const projectRoot = makeProject();
  writeConfig(projectRoot, {
    version: 1,
    projectType: "document-corpus",
    rawSourceRoots: [],
    writeWhitelist: ["../outside/**"],
  });

  const result = runHealthcheck(projectRoot);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /CONFIG_PATH_OUTSIDE_PROJECT/);
});

test("healthcheck rejects non-string write whitelist entries", () => {
  const projectRoot = makeProject();
  writeConfig(projectRoot, {
    version: 1,
    projectType: "document-corpus",
    rawSourceRoots: [],
    writeWhitelist: [123],
  });

  const result = runHealthcheck(projectRoot);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /WRITE_WHITELIST_INVALID_TYPE/);
});

test("healthcheck rejects null config root with structured JSON", () => {
  const projectRoot = makeProject();
  const configDir = path.join(projectRoot, ".project-wiki");
  fs.mkdirSync(configDir, { recursive: true });
  fs.writeFileSync(path.join(configDir, "project-wiki.config.json"), "null");

  const result = runHealthcheck(projectRoot);

  assert.notEqual(result.status, 0);
  assert.equal(result.parsed.status, "invalid_config");
  assert.match(result.stderr, /CONFIG_ROOT_INVALID_TYPE/);
});

test("healthcheck rejects write whitelist traversal after wildcard", () => {
  const projectRoot = makeProject();
  writeConfig(projectRoot, {
    version: 1,
    projectType: "document-corpus",
    rawSourceRoots: [],
    writeWhitelist: ["docs/**/../../../outside/**"],
  });

  const result = runHealthcheck(projectRoot);

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /CONFIG_PATH_OUTSIDE_PROJECT/);
});

test("healthcheck rejects symlinked config outside project root", () => {
  const projectRoot = makeProject();
  const outsideRoot = makeProject();
  fs.mkdirSync(path.join(projectRoot, ".project-wiki"));
  fs.writeFileSync(
    path.join(outsideRoot, "project-wiki.config.json"),
    JSON.stringify({ version: 1, projectType: "document-corpus" }),
  );
  const created = trySymlink(
    path.join(outsideRoot, "project-wiki.config.json"),
    path.join(projectRoot, ".project-wiki", "project-wiki.config.json"),
  );
  if (!created) {
    return;
  }

  const result = runHealthcheck(projectRoot);

  assert.notEqual(result.status, 0);
  assert.match(
    result.stderr,
    /CONFIG_PATH_OUTSIDE_PROJECT|CONFIG_PATH_IS_SYMLINK/,
  );
});

test("healthcheck rejects symlinked managed roots escaping project root", () => {
  const projectRoot = makeProject();
  const outsideRoot = makeProject();
  fs.mkdirSync(path.join(projectRoot, ".project-wiki"), { recursive: true });
  const created = trySymlink(
    outsideRoot,
    path.join(projectRoot, ".project-wiki", "wiki"),
    "junction",
  );
  if (!created) {
    return;
  }
  writeConfig(projectRoot, {
    version: 1,
    projectType: "document-corpus",
    wikiRoot: ".project-wiki/wiki",
    rawSourceRoots: [],
    writeWhitelist: [],
  });

  const result = runHealthcheck(projectRoot);

  assert.notEqual(result.status, 0);
  assert.equal(result.parsed.status, "invalid_config");
  assert.match(
    result.stderr,
    /CONFIG_PATH_IS_SYMLINK|CONFIG_PATH_OUTSIDE_PROJECT/,
  );
});

test("healthcheck rejects symlinked raw source roots escaping project root", () => {
  const projectRoot = makeProject();
  const outsideRoot = makeProject();
  const created = trySymlink(
    outsideRoot,
    path.join(projectRoot, "docs"),
    "junction",
  );
  if (!created) {
    return;
  }
  writeConfig(projectRoot, {
    version: 1,
    projectType: "document-corpus",
    rawSourceRoots: ["docs"],
    writeWhitelist: [],
  });

  const result = runHealthcheck(projectRoot);

  assert.notEqual(result.status, 0);
  assert.equal(result.parsed.status, "invalid_config");
  assert.match(
    result.stderr,
    /CONFIG_PATH_IS_SYMLINK|CONFIG_PATH_OUTSIDE_PROJECT/,
  );
});
