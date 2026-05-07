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
const adapterStatusPath = path.join(repoRoot, "scripts", "adapter-status.mjs");

function makeProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "project-wiki-adapters-"));
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

function tryCreateSymlink(target, linkPath, type) {
  try {
    fs.symlinkSync(target, linkPath, type);
    return true;
  } catch {
    return false;
  }
}

function writeJsonConfig(projectRoot, config) {
  const configDir = path.join(projectRoot, ".project-wiki");
  fs.mkdirSync(configDir, { recursive: true });
  fs.writeFileSync(
    path.join(configDir, "project-wiki.config.json"),
    JSON.stringify(config, null, 2),
  );
}

function runAdapterStatus(projectRoot) {
  const result = spawnSync(process.execPath, [adapterStatusPath, projectRoot], {
    encoding: "utf8",
  });
  const parsed = result.stdout ? JSON.parse(result.stdout) : null;
  return { ...result, parsed };
}

test("adapter status reports missing binding without creating files", () => {
  const projectRoot = makeProject();
  const beforeEntries = snapshotEntries(projectRoot);

  const result = runAdapterStatus(projectRoot);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.parsed.ok, true);
  assert.equal(result.parsed.readOnly, true);
  assert.equal(result.parsed.phase, "p4_adapter_readiness");
  assert.equal(result.parsed.binding.status, "needs_binding");
  assert.equal(
    result.parsed.adapters.sourceNormalization.state,
    "env_unavailable",
  );
  assert.equal(result.parsed.adapters.graph.state, "env_unavailable");
  assert.equal(result.parsed.adapters.export.state, "env_unavailable");
  assert.deepEqual(snapshotEntries(projectRoot), beforeEntries);
});

test("adapter status reports configured project with no optional adapters", () => {
  const projectRoot = makeProject();
  writeConfig(projectRoot);
  const beforeEntries = snapshotEntries(projectRoot);

  const result = runAdapterStatus(projectRoot);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.parsed.binding.status, "configured_with_warnings");
  assert.equal(
    result.parsed.adapters.sourceNormalization.state,
    "not_installed",
  );
  assert.equal(result.parsed.adapters.graph.state, "empty_result");
  assert.equal(result.parsed.adapters.export.state, "not_installed");
  assert.equal(result.parsed.adapters.graph.executionEnabled, false);
  assert.equal(result.parsed.summary.heavyActionsAvailable, false);
  assert.deepEqual(snapshotEntries(projectRoot), beforeEntries);
});

test("adapter status summarizes existing graph artifacts without compiling", () => {
  const projectRoot = makeProject();
  writeConfig(projectRoot);
  writeText(
    projectRoot,
    ".project-wiki/admin/graph.json",
    JSON.stringify({ nodes: [{ id: "topic" }], edges: [] }, null, 2),
  );
  writeText(projectRoot, ".project-wiki/admin/GRAPH_REPORT.md", "# Graph\n");
  const beforeEntries = snapshotEntries(projectRoot);

  const result = runAdapterStatus(projectRoot);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.parsed.adapters.graph.state, "configured");
  assert.equal(result.parsed.adapters.graph.executionEnabled, false);
  assert.ok(
    result.parsed.adapters.graph.artifacts.some(
      (artifact) => artifact.path === ".project-wiki/admin/graph.json",
    ),
  );
  assert.deepEqual(snapshotEntries(projectRoot), beforeEntries);
});

test("adapter status isolates invalid graph json as runtime failure", () => {
  const projectRoot = makeProject();
  writeConfig(projectRoot);
  writeText(projectRoot, ".project-wiki/admin/graph.json", "{ invalid json");

  const result = runAdapterStatus(projectRoot);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.parsed.adapters.graph.state, "runtime_failed");
  assert.match(
    result.parsed.adapters.graph.warnings.join("\n"),
    /INVALID_JSON/,
  );
});

test("adapter status isolates invalid graph report without marking graph configured", () => {
  const projectRoot = makeProject();
  writeConfig(projectRoot);
  fs.mkdirSync(path.join(projectRoot, ".project-wiki/admin/GRAPH_REPORT.md"), {
    recursive: true,
  });

  const result = runAdapterStatus(projectRoot);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.parsed.adapters.graph.state, "runtime_failed");
  assert.match(
    result.parsed.adapters.graph.warnings.join("\n"),
    /ARTIFACT_NOT_FILE/,
  );
});

test("adapter status reads explicit RetainPDF manifest", () => {
  const projectRoot = makeProject();
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
    JSON.stringify(
      { artifacts: [{ path: "docs/book.md", type: "markdown" }] },
      null,
      2,
    ),
  );

  const result = runAdapterStatus(projectRoot);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.parsed.adapters.sourceNormalization.state, "configured");
  assert.equal(
    result.parsed.adapters.sourceNormalization.artifacts[0].path,
    ".project-wiki/admin/retain-pdf/artifacts-manifest.json",
  );
});

test("adapter status rejects unsafe RetainPDF manifest path without outside read", () => {
  const projectRoot = makeProject();
  writeConfig(projectRoot, {
    optionalAdapters: {
      retainPdf: {
        manifestPath: "../outside.json",
      },
    },
  });

  const result = runAdapterStatus(projectRoot);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.parsed.adapters.sourceNormalization.state, "unsupported");
  assert.match(
    result.parsed.adapters.sourceNormalization.warnings.join("\n"),
    /UNSAFE_PATH/,
  );
});

test("adapter status rejects non-string and empty adapter paths without crashing", () => {
  const projectRoot = makeProject();
  writeJsonConfig(projectRoot, {
    version: 1,
    projectType: "document-corpus",
    adminRoot: ".project-wiki/admin",
    backupRoot: ".project-wiki/backups",
    rawSourceRoots: ["docs"],
    writeWhitelist: [".project-wiki/admin/**", ".project-wiki/backups/**"],
    optionalAdapters: {
      retainPdf: {
        manifestPath: { toString: null },
      },
      export: {
        planFile: "",
      },
    },
  });

  const result = runAdapterStatus(projectRoot);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.parsed.adapters.sourceNormalization.state, "unsupported");
  assert.equal(result.parsed.adapters.export.state, "unsupported");
  assert.match(
    result.parsed.adapters.sourceNormalization.warnings.join("\n"),
    /UNSAFE_PATH/,
  );
  assert.match(
    result.parsed.adapters.export.warnings.join("\n"),
    /UNSAFE_PATH/,
  );
  assert.doesNotMatch(result.stderr, /INTERNAL_ERROR/);
});

test("adapter status rejects falsy adapter path matrix", () => {
  for (const value of [false, 0, null, ""]) {
    const retainPdfRoot = makeProject();
    writeJsonConfig(retainPdfRoot, {
      version: 1,
      projectType: "document-corpus",
      adminRoot: ".project-wiki/admin",
      backupRoot: ".project-wiki/backups",
      rawSourceRoots: ["docs"],
      writeWhitelist: [".project-wiki/admin/**", ".project-wiki/backups/**"],
      optionalAdapters: {
        retainPdf: {
          manifestPath: value,
        },
      },
    });

    const retainPdfResult = runAdapterStatus(retainPdfRoot);

    assert.equal(retainPdfResult.status, 0, retainPdfResult.stderr);
    assert.equal(
      retainPdfResult.parsed.adapters.sourceNormalization.state,
      "unsupported",
    );
    assert.match(
      retainPdfResult.parsed.adapters.sourceNormalization.warnings.join("\n"),
      /UNSAFE_PATH/,
    );

    const exportRoot = makeProject();
    writeJsonConfig(exportRoot, {
      version: 1,
      projectType: "document-corpus",
      adminRoot: ".project-wiki/admin",
      backupRoot: ".project-wiki/backups",
      rawSourceRoots: ["docs"],
      writeWhitelist: [".project-wiki/admin/**", ".project-wiki/backups/**"],
      optionalAdapters: {
        export: {
          planFile: value,
        },
      },
    });

    const exportResult = runAdapterStatus(exportRoot);

    assert.equal(exportResult.status, 0, exportResult.stderr);
    assert.equal(exportResult.parsed.adapters.export.state, "unsupported");
    assert.match(
      exportResult.parsed.adapters.export.warnings.join("\n"),
      /UNSAFE_PATH/,
    );
  }
});

test("adapter status rejects symlinked adapter artifact paths", () => {
  const projectRoot = makeProject();
  const outsideRoot = makeProject();
  writeText(
    outsideRoot,
    "outside-manifest.json",
    JSON.stringify({ secret: true }),
  );
  const linkPath = path.join(
    projectRoot,
    ".project-wiki/admin/linked-manifest.json",
  );
  fs.mkdirSync(path.dirname(linkPath), { recursive: true });
  if (
    !tryCreateSymlink(
      path.join(outsideRoot, "outside-manifest.json"),
      linkPath,
      "file",
    )
  ) {
    return;
  }
  writeConfig(projectRoot, {
    optionalAdapters: {
      retainPdf: {
        manifestPath: ".project-wiki/admin/linked-manifest.json",
      },
    },
  });

  const result = runAdapterStatus(projectRoot);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.parsed.adapters.sourceNormalization.state, "unsupported");
  assert.match(
    result.parsed.adapters.sourceNormalization.warnings.join("\n"),
    /UNSAFE_PATH/,
  );
  assert.doesNotMatch(JSON.stringify(result.parsed), /secret/);
});

test("adapter status reports export plan without executing command", () => {
  const projectRoot = makeProject();
  writeConfig(projectRoot, {
    optionalAdapters: {
      export: {
        planFile: ".project-wiki/admin/export-plan.json",
      },
    },
  });
  writeText(
    projectRoot,
    ".project-wiki/admin/export-plan.json",
    JSON.stringify(
      { command: "touch SHOULD_NOT_EXIST", outputRoot: "site" },
      null,
      2,
    ),
  );

  const result = runAdapterStatus(projectRoot);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.parsed.adapters.export.state, "configured");
  assert.equal(result.parsed.adapters.export.executionEnabled, false);
  assert.equal(
    fs.existsSync(path.join(projectRoot, "SHOULD_NOT_EXIST")),
    false,
  );
});

test("adapter status rejects invalid project roots with structured error", () => {
  const projectRoot = path.join(makeProject(), "missing");

  const result = runAdapterStatus(projectRoot);

  assert.notEqual(result.status, 0);
  assert.equal(result.parsed.projectRoot, null);
  assert.ok(Array.isArray(result.parsed.errors));
  assert.equal(result.parsed.errors[0].code, "PROJECT_ROOT_MISSING");
  assert.match(result.stderr, /PROJECT_ROOT_MISSING/);
});
