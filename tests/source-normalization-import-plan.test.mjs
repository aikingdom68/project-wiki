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
const importPlanPath = path.join(
  repoRoot,
  "scripts",
  "source-normalization-import-plan.mjs",
);

function makeProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "project-wiki-import-plan-"));
}

function writeConfig(projectRoot, config = {}) {
  const configDir = path.join(projectRoot, ".project-wiki");
  fs.mkdirSync(configDir, { recursive: true });
  fs.writeFileSync(
    path.join(configDir, "project-wiki.config.json"),
    JSON.stringify(
      {
        version: 1,
        projectType: "document-corpus",
        adminRoot: ".project-wiki/admin",
        backupRoot: ".project-wiki/backups",
        rawSourceRoots: ["docs"],
        writeWhitelist: [".project-wiki/admin/**", ".project-wiki/backups/**"],
        ...config,
      },
      null,
      2,
    ),
  );
}

function writeText(projectRoot, relativePath, content) {
  const filePath = path.join(projectRoot, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function snapshotEntries(projectRoot) {
  const entries = [];
  walkSnapshot(projectRoot, projectRoot, entries);
  return entries.sort();
}

function walkSnapshot(root, currentPath, entries) {
  for (const entry of fs.readdirSync(currentPath).sort()) {
    const absolutePath = path.join(currentPath, entry);
    const relativePath = path
      .relative(root, absolutePath)
      .replaceAll(path.sep, "/");
    const stat = fs.lstatSync(absolutePath);
    if (stat.isDirectory()) {
      entries.push(`${relativePath}/`);
      walkSnapshot(root, absolutePath, entries);
      continue;
    }
    entries.push(`${relativePath}:${stat.size}`);
  }
}

function runImportPlan(projectRoot) {
  const result = spawnSync(process.execPath, [importPlanPath, projectRoot], {
    encoding: "utf8",
  });
  const parsed = result.stdout ? JSON.parse(result.stdout) : null;
  return { ...result, parsed };
}

function configureRetainPdfManifest(projectRoot, manifest) {
  writeConfig(projectRoot, {
    optionalAdapters: {
      retainPdf: {
        manifestPath: ".project-wiki/admin/retain-pdf/artifacts-manifest.json",
      },
    },
  });
  writeText(
    projectRoot,
    ".project-wiki/admin/retain-pdf/artifacts-manifest.json",
    JSON.stringify(manifest, null, 2),
  );
}

function tryCreateSymlink(target, linkPath, type) {
  try {
    fs.symlinkSync(target, linkPath, type);
    return true;
  } catch {
    return false;
  }
}

test("source normalization import plan reports missing binding without creating files", () => {
  const projectRoot = makeProject();
  const beforeEntries = snapshotEntries(projectRoot);

  const result = runImportPlan(projectRoot);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.parsed.ok, true);
  assert.equal(result.parsed.readOnly, true);
  assert.equal(
    result.parsed.phase,
    "p4_2_source_normalization_import_planning",
  );
  assert.equal(result.parsed.binding.status, "needs_binding");
  assert.equal(result.parsed.adapter.state, "env_unavailable");
  assert.equal(result.parsed.plan.executionEnabled, false);
  assert.deepEqual(snapshotEntries(projectRoot), beforeEntries);
});

test("source normalization import plan reports missing RetainPDF manifest config", () => {
  const projectRoot = makeProject();
  writeConfig(projectRoot);

  const result = runImportPlan(projectRoot);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.parsed.adapter.state, "not_installed");
  assert.equal(result.parsed.summary.heavyActionsAvailable, false);
});

test("source normalization import plan builds read-only candidates from manifest", () => {
  const projectRoot = makeProject();
  writeText(
    projectRoot,
    ".project-wiki/admin/retain-pdf/markdown/full.md",
    "# Book\n",
  );
  writeText(
    projectRoot,
    ".project-wiki/admin/retain-pdf/document.v1.json",
    JSON.stringify({ title: "Book" }),
  );
  configureRetainPdfManifest(projectRoot, {
    command: "touch SHOULD_NOT_EXIST",
    artifacts: [
      {
        path: ".project-wiki/admin/retain-pdf/markdown/full.md",
        type: "markdown",
        title: "Book Markdown",
        secret: "do-not-echo",
      },
      {
        path: ".project-wiki/admin/retain-pdf/document.v1.json",
        type: "normalized_document_json",
      },
      {
        path: "https://example.com/book.pdf",
        type: "pdf",
      },
      {
        path: "../outside.md",
        type: "markdown",
      },
    ],
  });
  const beforeEntries = snapshotEntries(projectRoot);

  const result = runImportPlan(projectRoot);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.parsed.adapter.state, "configured");
  assert.equal(result.parsed.plan.planningOnly, true);
  assert.equal(result.parsed.plan.applyEndpointAvailable, false);
  assert.equal(result.parsed.plan.proposedRegistryTarget.willWrite, false);
  assert.equal(result.parsed.summary.manifestArtifacts, 4);
  assert.equal(result.parsed.summary.importable, 2);
  assert.equal(result.parsed.summary.excluded, 2);
  assert.ok(
    result.parsed.plan.candidates.every(
      (candidate) =>
        candidate.proposedRegistryEntry.import_status === "planned_only",
    ),
  );
  assert.doesNotMatch(JSON.stringify(result.parsed), /do-not-echo/);
  assert.doesNotMatch(JSON.stringify(result.parsed), /SHOULD_NOT_EXIST/);
  assert.equal(
    fs.existsSync(path.join(projectRoot, "SHOULD_NOT_EXIST")),
    false,
  );
  assert.deepEqual(snapshotEntries(projectRoot), beforeEntries);
});

test("source normalization import plan reports invalid and missing manifests", () => {
  const invalidRoot = makeProject();
  writeConfig(invalidRoot, {
    optionalAdapters: {
      retainPdf: {
        manifestPath: ".project-wiki/admin/retain-pdf/artifacts-manifest.json",
      },
    },
  });
  writeText(
    invalidRoot,
    ".project-wiki/admin/retain-pdf/artifacts-manifest.json",
    "{ bad",
  );

  const invalidResult = runImportPlan(invalidRoot);

  assert.equal(invalidResult.status, 0, invalidResult.stderr);
  assert.equal(invalidResult.parsed.adapter.state, "runtime_failed");
  assert.match(invalidResult.parsed.warnings.join("\n"), /INVALID_JSON/);

  const missingRoot = makeProject();
  writeConfig(missingRoot, {
    optionalAdapters: {
      retainPdf: {
        manifestPath: ".project-wiki/admin/retain-pdf/artifacts-manifest.json",
      },
    },
  });

  const missingResult = runImportPlan(missingRoot);

  assert.equal(missingResult.status, 0, missingResult.stderr);
  assert.equal(missingResult.parsed.adapter.state, "empty_result");
});

test("source normalization import plan rejects unsafe manifest and symlinked artifacts", () => {
  const unsafeRoot = makeProject();
  writeConfig(unsafeRoot, {
    optionalAdapters: {
      retainPdf: {
        manifestPath: "../outside.json",
      },
    },
  });

  const unsafeResult = runImportPlan(unsafeRoot);

  assert.equal(unsafeResult.status, 0, unsafeResult.stderr);
  assert.equal(unsafeResult.parsed.adapter.state, "unsupported");
  assert.match(unsafeResult.parsed.warnings.join("\n"), /UNSAFE_PATH/);

  const symlinkRoot = makeProject();
  const outsideRoot = makeProject();
  writeText(outsideRoot, "outside.md", "secret");
  const linkPath = path.join(
    symlinkRoot,
    ".project-wiki/admin/retain-pdf/linked.md",
  );
  fs.mkdirSync(path.dirname(linkPath), { recursive: true });
  if (
    !tryCreateSymlink(path.join(outsideRoot, "outside.md"), linkPath, "file")
  ) {
    return;
  }
  configureRetainPdfManifest(symlinkRoot, {
    artifacts: [
      {
        path: ".project-wiki/admin/retain-pdf/linked.md",
        type: "markdown",
      },
    ],
  });

  const symlinkResult = runImportPlan(symlinkRoot);

  assert.equal(symlinkResult.status, 0, symlinkResult.stderr);
  assert.equal(symlinkResult.parsed.summary.unsafe, 1);
  assert.equal(symlinkResult.parsed.plan.candidates.length, 0);
  assert.equal(symlinkResult.parsed.plan.excluded[0].reason, "UNSAFE_PATH");
  assert.doesNotMatch(JSON.stringify(symlinkResult.parsed), /secret/);
});

test("source normalization import plan rejects invalid project roots with structured error", () => {
  const projectRoot = path.join(makeProject(), "missing");

  const result = runImportPlan(projectRoot);

  assert.notEqual(result.status, 0);
  assert.equal(result.parsed.status, "invalid_project_root");
  assert.match(result.stderr, /PROJECT_ROOT_MISSING/);
});
