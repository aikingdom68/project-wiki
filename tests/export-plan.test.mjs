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
const exportPlanPath = path.join(repoRoot, "scripts", "export-plan.mjs");

function makeProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "project-wiki-export-plan-"));
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
        wikiRoot: ".project-wiki/wiki",
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

function runExportPlan(projectRoot) {
  const result = spawnSync(process.execPath, [exportPlanPath, projectRoot], {
    encoding: "utf8",
  });
  const parsed = result.stdout ? JSON.parse(result.stdout) : null;
  return { ...result, parsed };
}

function configureExportPlan(projectRoot, plan, exportConfig = {}) {
  writeConfig(projectRoot, {
    optionalAdapters: {
      export: {
        planFile: ".project-wiki/admin/export-plan.json",
        ...exportConfig,
      },
    },
  });
  writeText(
    projectRoot,
    ".project-wiki/admin/export-plan.json",
    JSON.stringify(plan, null, 2),
  );
}

test("export plan reports missing binding without creating files", () => {
  const projectRoot = makeProject();
  const beforeEntries = snapshotEntries(projectRoot);

  const result = runExportPlan(projectRoot);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.parsed.ok, true);
  assert.equal(result.parsed.readOnly, true);
  assert.equal(result.parsed.phase, "p4_4_export_planning");
  assert.equal(result.parsed.binding.status, "needs_binding");
  assert.equal(result.parsed.adapter.state, "env_unavailable");
  assert.equal(result.parsed.plan.executionEnabled, false);
  assert.equal(result.parsed.plan.exportEndpointAvailable, false);
  assert.deepEqual(snapshotEntries(projectRoot), beforeEntries);
});

test("export plan reports configured project with no export adapter", () => {
  const projectRoot = makeProject();
  writeConfig(projectRoot);

  const result = runExportPlan(projectRoot);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.parsed.adapter.state, "not_installed");
  assert.equal(result.parsed.plan.outputRoot.path, ".project-wiki/export");
  assert.deepEqual(result.parsed.plan.sourceScope.roots, [
    { role: "wiki", path: ".project-wiki/wiki", confirmed: false },
    { role: "raw_source", path: "docs", confirmed: false },
  ]);
  assert.equal(result.parsed.plan.outputRoot.willWrite, false);
  assert.equal(result.parsed.plan.exportAllowed, false);
  assert.equal(result.parsed.summary.exportAllowed, false);
});

test("export plan summarizes explicit plan without executing or echoing commands", () => {
  const projectRoot = makeProject();
  configureExportPlan(projectRoot, {
    target: "static-site",
    profile: "quartz",
    outputRoot: ".project-wiki/export/site",
    rollback: {
      strategy: "remove_generated_output",
      backupRoot: ".project-wiki/backups/export",
    },
    dependencyBoundary: {
      requiredToExecute: 1,
      toolchain: "quartz",
    },
    command: "touch SHOULD_NOT_EXIST",
    commands: ["touch ALSO_SHOULD_NOT_EXIST"],
  });
  const beforeEntries = snapshotEntries(projectRoot);

  const result = runExportPlan(projectRoot);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.parsed.adapter.state, "configured");
  assert.equal(result.parsed.plan.planningOnly, true);
  assert.equal(result.parsed.plan.exportAllowed, false);
  assert.equal(result.parsed.plan.outputRoot.path, ".project-wiki/export/site");
  assert.equal(result.parsed.plan.outputRoot.willWrite, false);
  assert.equal(result.parsed.plan.target.value, "static-site");
  assert.equal(result.parsed.plan.target.confirmed, false);
  assert.equal(result.parsed.plan.profile.value, "quartz");
  assert.equal(result.parsed.plan.profile.confirmed, false);
  assert.equal(result.parsed.plan.rollback.strategy, "remove_generated_output");
  assert.equal(result.parsed.plan.rollback.confirmed, false);
  assert.equal(result.parsed.plan.dependencyBoundary.requiredToExecute, 3);
  assert.equal(result.parsed.plan.dependencyBoundary.installAllowed, false);
  assert.equal(
    result.parsed.plan.dependencyBoundary.commandExecutionAllowed,
    false,
  );
  assert.doesNotMatch(JSON.stringify(result.parsed), /SHOULD_NOT_EXIST/);
  assert.doesNotMatch(JSON.stringify(result.parsed), /ALSO_SHOULD_NOT_EXIST/);
  assert.equal(
    fs.existsSync(path.join(projectRoot, "SHOULD_NOT_EXIST")),
    false,
  );
  assert.equal(
    fs.existsSync(path.join(projectRoot, "ALSO_SHOULD_NOT_EXIST")),
    false,
  );
  assert.deepEqual(snapshotEntries(projectRoot), beforeEntries);
});

test("export plan reports missing explicit plan file as empty result", () => {
  const projectRoot = makeProject();
  writeConfig(projectRoot, {
    optionalAdapters: {
      export: {
        planFile: ".project-wiki/admin/export-plan.json",
      },
    },
  });

  const result = runExportPlan(projectRoot);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.parsed.adapter.state, "empty_result");
  assert.equal(result.parsed.plan.executionEnabled, false);
  assert.equal(result.parsed.summary.exportAllowed, false);
});

test("export plan isolates invalid JSON as runtime failure", () => {
  const projectRoot = makeProject();
  writeConfig(projectRoot, {
    optionalAdapters: {
      export: {
        planFile: ".project-wiki/admin/export-plan.json",
      },
    },
  });
  writeText(projectRoot, ".project-wiki/admin/export-plan.json", "{ bad");

  const result = runExportPlan(projectRoot);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.parsed.adapter.state, "runtime_failed");
  assert.match(result.parsed.warnings.join("\n"), /INVALID_JSON/);
  assert.equal(result.parsed.plan.executionEnabled, false);
  assert.equal(result.parsed.plan.exportAllowed, false);
});

test("export plan rejects unsafe plan file", () => {
  const projectRoot = makeProject();
  writeConfig(projectRoot, {
    optionalAdapters: {
      export: {
        planFile: "../outside-export-plan.json",
      },
    },
  });

  const result = runExportPlan(projectRoot);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.parsed.adapter.state, "unsupported");
  assert.match(result.parsed.warnings.join("\n"), /UNSAFE_PATH/);
  assert.equal(result.parsed.plan.executionEnabled, false);
  assert.equal(result.parsed.plan.exportAllowed, false);
});

test("export plan keeps unsafe output roots planning-only", () => {
  const unsafeConfigRoot = makeProject();
  configureExportPlan(
    unsafeConfigRoot,
    {
      target: "static-site",
      profile: "quartz",
      outputRoot: ".project-wiki/export/site",
      rollback: { strategy: "manual_review" },
    },
    {
      outputRoot: "../outside-export",
    },
  );

  const unsafeConfigResult = runExportPlan(unsafeConfigRoot);

  assert.equal(unsafeConfigResult.status, 0, unsafeConfigResult.stderr);
  assert.equal(
    unsafeConfigResult.parsed.plan.outputRoot.path,
    "../outside-export",
  );
  assert.equal(unsafeConfigResult.parsed.plan.outputRoot.safe, false);
  assert.equal(unsafeConfigResult.parsed.plan.outputRoot.willWrite, false);
  assert.equal(unsafeConfigResult.parsed.plan.exportAllowed, false);
  assert.match(unsafeConfigResult.parsed.warnings.join("\n"), /UNSAFE_PATH/);

  const unsafePlanRoot = makeProject();
  configureExportPlan(unsafePlanRoot, {
    target: "static-site",
    profile: "quartz",
    outputRoot: "../outside-from-plan",
    rollback: { strategy: "manual_review" },
  });

  const unsafePlanResult = runExportPlan(unsafePlanRoot);

  assert.equal(unsafePlanResult.status, 0, unsafePlanResult.stderr);
  assert.equal(
    unsafePlanResult.parsed.plan.outputRoot.path,
    "../outside-from-plan",
  );
  assert.equal(unsafePlanResult.parsed.plan.outputRoot.safe, false);
  assert.equal(unsafePlanResult.parsed.plan.outputRoot.willWrite, false);
  assert.equal(unsafePlanResult.parsed.plan.exportAllowed, false);
  assert.match(unsafePlanResult.parsed.warnings.join("\n"), /UNSAFE_PATH/);
});

test("export plan rejects invalid project roots with structured error", () => {
  const projectRoot = path.join(makeProject(), "missing");

  const result = runExportPlan(projectRoot);

  assert.notEqual(result.status, 0);
  assert.ok(result.parsed, result.stderr);
  assert.equal(result.parsed.status, "invalid_project_root");
  assert.match(result.stderr, /PROJECT_ROOT_MISSING/);
});
