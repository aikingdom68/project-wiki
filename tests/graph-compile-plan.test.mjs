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
const graphCompilePlanPath = path.join(
  repoRoot,
  "scripts",
  "graph-compile-plan.mjs",
);

function makeProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "project-wiki-graph-plan-"));
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

function runGraphCompilePlan(projectRoot) {
  const result = spawnSync(
    process.execPath,
    [graphCompilePlanPath, projectRoot],
    {
      encoding: "utf8",
    },
  );
  const parsed = result.stdout ? JSON.parse(result.stdout) : null;
  return { ...result, parsed };
}

test("graph compile plan reports missing binding without creating files", () => {
  const projectRoot = makeProject();
  const beforeEntries = snapshotEntries(projectRoot);

  const result = runGraphCompilePlan(projectRoot);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.parsed.ok, true);
  assert.equal(result.parsed.readOnly, true);
  assert.equal(result.parsed.phase, "p4_3_graph_compile_planning");
  assert.equal(result.parsed.binding.status, "needs_binding");
  assert.equal(result.parsed.adapter.state, "env_unavailable");
  assert.equal(result.parsed.plan.executionEnabled, false);
  assert.equal(result.parsed.plan.compileEndpointAvailable, false);
  assert.deepEqual(snapshotEntries(projectRoot), beforeEntries);
});

test("graph compile plan reports empty graph artifacts with default targets", () => {
  const projectRoot = makeProject();
  writeConfig(projectRoot);

  const result = runGraphCompilePlan(projectRoot);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.parsed.adapter.state, "empty_result");
  assert.equal(result.parsed.plan.schemaProfile.value, "auto");
  assert.equal(result.parsed.plan.schemaProfile.confirmed, false);
  assert.equal(result.parsed.plan.artifactTarget.graphJson.willWrite, false);
  assert.equal(
    result.parsed.plan.artifactTarget.graphJson.path,
    ".project-wiki/admin/graph.json",
  );
  assert.equal(
    result.parsed.plan.artifactTarget.graphReport.path,
    ".project-wiki/admin/GRAPH_REPORT.md",
  );
  assert.equal(result.parsed.summary.heavyActionsAvailable, false);
  assert.equal(result.parsed.summary.compileAllowed, false);
});

test("graph compile plan summarizes existing artifacts without durable truth", () => {
  const projectRoot = makeProject();
  writeConfig(projectRoot);
  writeText(
    projectRoot,
    ".project-wiki/admin/graph.json",
    JSON.stringify(
      {
        nodes: [{ id: "secret-node", label: "Sensitive" }],
        edges: [{ source: "secret-node", target: "other", label: "inferred" }],
      },
      null,
      2,
    ),
  );
  writeText(
    projectRoot,
    ".project-wiki/admin/GRAPH_REPORT.md",
    "# Graph Report\n",
  );
  const beforeEntries = snapshotEntries(projectRoot);

  const result = runGraphCompilePlan(projectRoot);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.parsed.adapter.state, "configured");
  assert.equal(result.parsed.summary.existingArtifacts, 2);
  assert.match(JSON.stringify(result.parsed), /nodeCount/);
  assert.match(JSON.stringify(result.parsed), /edgeCount/);
  assert.doesNotMatch(JSON.stringify(result.parsed), /secret-node/);
  assert.equal(
    result.parsed.plan.confidencePolicy.inferredRelationshipsDurable,
    false,
  );
  assert.deepEqual(snapshotEntries(projectRoot), beforeEntries);
});

test("graph compile plan follows schema profile precedence", () => {
  const rootProfileProject = makeProject();
  writeConfig(rootProfileProject, { schemaProfile: "document-corpus" });

  const rootProfileResult = runGraphCompilePlan(rootProfileProject);

  assert.equal(rootProfileResult.status, 0, rootProfileResult.stderr);
  assert.equal(
    rootProfileResult.parsed.plan.schemaProfile.value,
    "document-corpus",
  );

  const graphProfileProject = makeProject();
  writeConfig(graphProfileProject, {
    schemaProfile: "document-corpus",
    optionalAdapters: {
      graph: {
        schemaProfile: "teaching-kb",
      },
    },
  });

  const graphProfileResult = runGraphCompilePlan(graphProfileProject);

  assert.equal(graphProfileResult.status, 0, graphProfileResult.stderr);
  assert.equal(
    graphProfileResult.parsed.plan.schemaProfile.value,
    "teaching-kb",
  );
});

test("graph compile plan keeps invalid artifacts planning-only", () => {
  const projectRoot = makeProject();
  writeConfig(projectRoot);
  writeText(projectRoot, ".project-wiki/admin/graph.json", "{ bad");

  const result = runGraphCompilePlan(projectRoot);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.parsed.adapter.state, "runtime_failed");
  assert.match(result.parsed.warnings.join("\n"), /INVALID_JSON/);
  assert.equal(result.parsed.plan.executionEnabled, false);
  assert.equal(result.parsed.plan.graphWriteEnabled, false);
});

test("graph compile plan rejects unsafe graph paths and ignores command fields", () => {
  const projectRoot = makeProject();
  writeConfig(projectRoot, {
    optionalAdapters: {
      graph: {
        graphJson: "../outside.json",
        command: "touch SHOULD_NOT_EXIST",
      },
    },
  });

  const result = runGraphCompilePlan(projectRoot);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.parsed.adapter.state, "unsupported");
  assert.match(result.parsed.warnings.join("\n"), /UNSAFE_PATH/);
  assert.doesNotMatch(JSON.stringify(result.parsed), /SHOULD_NOT_EXIST/);
  assert.equal(
    fs.existsSync(path.join(projectRoot, "SHOULD_NOT_EXIST")),
    false,
  );
});

test("graph compile plan rejects invalid project roots with structured error", () => {
  const projectRoot = path.join(makeProject(), "missing");

  const result = runGraphCompilePlan(projectRoot);

  assert.notEqual(result.status, 0);
  assert.equal(result.parsed.status, "invalid_project_root");
  assert.match(result.stderr, /PROJECT_ROOT_MISSING/);
});
