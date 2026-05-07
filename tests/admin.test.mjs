import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import http from "node:http";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const adminPath = path.join(repoRoot, "scripts", "admin.mjs");

function makeProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "project-wiki-admin-target-"));
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

function writeConfig(projectRoot, config) {
  const configDir = path.join(projectRoot, ".project-wiki");
  fs.mkdirSync(configDir, { recursive: true });
  fs.writeFileSync(
    path.join(configDir, "project-wiki.config.json"),
    JSON.stringify(config, null, 2),
  );
}

function writeText(projectRoot, relativePath, content) {
  const filePath = path.join(projectRoot, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
}

function startAdmin(projectRoot, extraArgs = []) {
  const child = spawn(
    process.execPath,
    [adminPath, projectRoot, "--port", "0", ...extraArgs],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );

  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => {
    stdout += chunk.toString();
  });
  child.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  const ready = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      child.kill();
      reject(
        new Error(
          `admin server did not start\nstdout:${stdout}\nstderr:${stderr}`,
        ),
      );
    }, 5000);

    child.stdout.on("data", () => {
      const line = stdout.split(/\r?\n/).find((entry) => entry.trim());
      if (!line) return;

      try {
        const parsed = JSON.parse(line);
        if (parsed.event === "admin:ready") {
          clearTimeout(timeout);
          resolve({
            child,
            ready: parsed,
            stdout: () => stdout,
            stderr: () => stderr,
          });
        }
      } catch {
        clearTimeout(timeout);
        child.kill();
        reject(new Error(`admin server emitted non-JSON ready line: ${line}`));
      }
    });

    child.once("exit", (code) => {
      clearTimeout(timeout);
      reject(
        new Error(
          `admin server exited early with ${code}\nstdout:${stdout}\nstderr:${stderr}`,
        ),
      );
    });
  });

  return { child, ready };
}

async function withAdmin(projectRoot, callback, extraArgs = []) {
  const started = startAdmin(projectRoot, extraArgs);
  const server = await started.ready;
  try {
    await callback(server.ready.url, server);
  } finally {
    server.child.kill();
    await new Promise((resolve) => server.child.once("exit", resolve));
  }
}

async function readJson(response) {
  assert.match(response.headers.get("content-type") ?? "", /application\/json/);
  return response.json();
}

function rawGetJson(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const request = http.request(
      {
        hostname: parsed.hostname,
        port: parsed.port,
        path: parsed.pathname,
        method: "GET",
        headers,
      },
      (response) => {
        let body = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          body += chunk;
        });
        response.on("end", () => {
          resolve({
            status: response.statusCode,
            headers: response.headers,
            body: JSON.parse(body),
          });
        });
      },
    );
    request.on("error", reject);
    request.end();
  });
}

function createConfiguredProject() {
  const projectRoot = makeProject();
  writeText(
    projectRoot,
    "docs/source.md",
    "# Source\n\nAlpha source evidence.\n",
  );
  writeText(
    projectRoot,
    ".project-wiki/wiki/topic.md",
    "# Topic\n\nAlpha wiki note.\n",
  );
  writeText(
    projectRoot,
    ".project-wiki/admin/graph.json",
    JSON.stringify({ nodes: [{ id: "topic" }], edges: [] }, null, 2),
  );
  writeConfig(projectRoot, {
    version: 1,
    projectType: "document-corpus",
    projectRoot: ".",
    wikiRoot: ".project-wiki/wiki",
    adminRoot: ".project-wiki/admin",
    rawSourceRoots: ["docs"],
    writeWhitelist: [
      ".project-wiki/wiki/**",
      ".project-wiki/admin/**",
      ".project-wiki/backups/**",
    ],
  });
  return projectRoot;
}

test("admin starts on 127.0.0.1 and reports read-only readiness", async () => {
  const projectRoot = makeProject();

  await withAdmin(projectRoot, async (baseUrl, server) => {
    assert.equal(server.ready.ok, true);
    assert.equal(server.ready.event, "admin:ready");
    assert.equal(server.ready.host, "127.0.0.1");
    assert.equal(server.ready.readOnlyInspection, true);
    assert.equal(server.ready.writeMode, "append-only-curation");
    assert.equal(typeof server.ready.writeToken, "string");
    assert.match(server.ready.writeToken, /^[a-f0-9]{64}$/);
    assert.match(server.ready.url, /^http:\/\/127\.0\.0\.1:\d+\/admin$/);
    assert.equal(baseUrl, server.ready.url);
  });
});

test("admin rejects non-loopback hosts", async () => {
  const projectRoot = makeProject();
  const child = spawn(
    process.execPath,
    [adminPath, projectRoot, "--host", "0.0.0.0", "--port", "0"],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );

  let stderr = "";
  child.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });
  const code = await new Promise((resolve) => child.once("exit", resolve));

  assert.notEqual(code, 0);
  assert.match(stderr, /ADMIN_HOST_NOT_LOOPBACK/);
});

test("admin rejects mismatched Host headers", async () => {
  const projectRoot = createConfiguredProject();

  await withAdmin(projectRoot, async (baseUrl) => {
    const response = await rawGetJson(
      `${baseUrl.replace(/\/admin$/, "")}/api/kb/admin/health`,
      { host: "attacker.example" },
    );

    assert.equal(response.status, 403);
    assert.equal(response.body.error, "ADMIN_HOST_REJECTED");
  });
});
test("admin reports missing binding without creating files", async () => {
  const projectRoot = makeProject();
  const beforeEntries = snapshotEntries(projectRoot);

  await withAdmin(projectRoot, async (baseUrl) => {
    const response = await fetch(
      `${baseUrl.replace(/\/admin$/, "")}/api/kb/admin/health`,
    );
    const body = await readJson(response);

    assert.equal(response.status, 200);
    assert.equal(body.readOnlyInspection, true);
    assert.equal(body.health.status, "needs_binding");
    assert.equal(body.health.config.exists, false);
  });

  assert.deepEqual(snapshotEntries(projectRoot), beforeEntries);
});

test("admin serves local static UI without external assets", async () => {
  const projectRoot = createConfiguredProject();

  await withAdmin(projectRoot, async (baseUrl) => {
    const html = await fetch(baseUrl);
    const script = await fetch(
      `${baseUrl.replace(/\/admin$/, "")}/admin/app.js`,
    );
    const style = await fetch(
      `${baseUrl.replace(/\/admin$/, "")}/admin/style.css`,
    );

    assert.equal(html.status, 200);
    assert.match(html.headers.get("content-type") ?? "", /text\/html/);
    const htmlText = await html.text();
    assert.match(htmlText, /Project Wiki Admin/);
    assert.doesNotMatch(htmlText, /https?:\/\//);
    assert.equal(script.status, 200);
    assert.match(
      script.headers.get("content-security-policy") ?? "",
      /default-src 'none'/,
    );
    assert.equal(style.status, 200);
  });
});

test("admin exposes configured summary tree items previews query and graph", async () => {
  const projectRoot = createConfiguredProject();

  await withAdmin(projectRoot, async (baseUrl) => {
    const rootUrl = baseUrl.replace(/\/admin$/, "");
    const summary = await readJson(
      await fetch(`${rootUrl}/api/kb/admin/summary`),
    );
    assert.equal(summary.ok, true);
    assert.equal(summary.projectType.value, "document-corpus");
    assert.equal(summary.paths.wikiRoot.exists, true);

    const tree = await readJson(await fetch(`${rootUrl}/api/kb/admin/tree`));
    assert.equal(tree.ok, true);
    assert.ok(
      tree.items.some(
        (item) =>
          item.kind === "wiki" && item.path === ".project-wiki/wiki/topic.md",
      ),
    );
    assert.ok(
      tree.items.some(
        (item) => item.kind === "source" && item.path === "docs/source.md",
      ),
    );
    assert.ok(tree.items.every((item) => item.kind !== "admin"));

    const items = await readJson(await fetch(`${rootUrl}/api/kb/admin/items`));
    assert.equal(items.ok, true);
    assert.ok(items.items.every((item) => typeof item.id === "string"));
    assert.ok(items.items.every((item) => item.kind !== "admin"));

    const wikiItem = items.items.find((item) => item.kind === "wiki");
    const sourceItem = items.items.find((item) => item.kind === "source");
    assert.ok(wikiItem);
    assert.ok(sourceItem);

    const wikiPreview = await readJson(
      await fetch(
        `${rootUrl}/api/kb/admin/item/${encodeURIComponent(wikiItem.id)}`,
      ),
    );
    assert.equal(wikiPreview.ok, true);
    assert.match(wikiPreview.content, /Alpha wiki note/);

    const sourcePreview = await readJson(
      await fetch(
        `${rootUrl}/api/kb/admin/source/${encodeURIComponent(sourceItem.id)}`,
      ),
    );
    assert.equal(sourcePreview.ok, true);
    assert.match(sourcePreview.content, /Alpha source evidence/);

    const blockedContentType = await fetch(
      `${rootUrl}/api/kb/admin/test-query`,
      {
        method: "POST",
        body: JSON.stringify({ query: "Alpha" }),
      },
    );
    assert.equal(blockedContentType.status, 415);
    const blockedContentTypeBody = await readJson(blockedContentType);
    assert.equal(blockedContentTypeBody.error, "CONTENT_TYPE_JSON_REQUIRED");

    const blockedOrigin = await fetch(`${rootUrl}/api/kb/admin/test-query`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://evil.example",
      },
      body: JSON.stringify({ query: "Alpha" }),
    });
    assert.equal(blockedOrigin.status, 403);
    const blockedOriginBody = await readJson(blockedOrigin);
    assert.equal(blockedOriginBody.error, "ADMIN_ORIGIN_REJECTED");

    const graph = await readJson(await fetch(`${rootUrl}/api/kb/admin/graph`));
    assert.equal(graph.ok, true);
    assert.equal(graph.state, "configured");
    assert.deepEqual(graph.artifacts.graphJson.data.nodes, [{ id: "topic" }]);
  });
});

test("admin exposes read-only adapter readiness status", async () => {
  const projectRoot = createConfiguredProject();
  const beforeEntries = snapshotEntries(projectRoot);

  await withAdmin(projectRoot, async (baseUrl) => {
    const rootUrl = baseUrl.replace(/\/admin$/, "");
    const adapters = await readJson(
      await fetch(`${rootUrl}/api/kb/admin/adapters`),
    );
    assert.equal(adapters.ok, true);
    assert.equal(adapters.readOnly, true);
    assert.equal(adapters.phase, "p4_adapter_readiness");
    assert.equal(adapters.adapters.graph.state, "configured");
    assert.equal(adapters.adapters.graph.executionEnabled, false);

    const postResponse = await fetch(`${rootUrl}/api/kb/admin/adapters`, {
      method: "POST",
    });
    assert.equal(postResponse.status, 405);
  });

  assert.deepEqual(snapshotEntries(projectRoot), beforeEntries);
});

test("admin adapter readiness reports malformed config as structured status", async () => {
  const projectRoot = makeProject();
  const configDir = path.join(projectRoot, ".project-wiki");
  fs.mkdirSync(configDir, { recursive: true });
  fs.writeFileSync(
    path.join(configDir, "project-wiki.config.json"),
    "{ broken",
  );

  await withAdmin(projectRoot, async (baseUrl) => {
    const rootUrl = baseUrl.replace(/\/admin$/, "");
    const response = await fetch(`${rootUrl}/api/kb/admin/adapters`);
    const body = await readJson(response);

    assert.equal(response.status, 200);
    assert.equal(body.ok, true);
    assert.equal(body.readOnly, true);
    assert.equal(body.phase, "p4_adapter_readiness");
    assert.ok(Array.isArray(body.binding.errors));
    assert.equal(body.binding.errors[0].code, "INVALID_CONFIG_JSON");
    assert.equal(body.adapters.graph.state, "env_unavailable");
    assert.doesNotMatch(JSON.stringify(body), /INTERNAL_ERROR/);
  });
});

test("admin exposes read-only graph compile plan", async () => {
  const projectRoot = createConfiguredProject();
  const beforeEntries = snapshotEntries(projectRoot);

  await withAdmin(projectRoot, async (baseUrl) => {
    const rootUrl = baseUrl.replace(/\/admin$/, "");
    const health = await readJson(
      await fetch(`${rootUrl}/api/kb/admin/health`),
    );
    assert.equal(health.features.graphCompilePlanning, true);
    assert.equal(health.features.graphCompile, false);

    const plan = await readJson(
      await fetch(`${rootUrl}/api/kb/admin/graph/compile-plan`),
    );
    assert.equal(plan.ok, true);
    assert.equal(plan.readOnly, true);
    assert.equal(plan.phase, "p4_3_graph_compile_planning");
    assert.equal(plan.adapter.state, "configured");
    assert.equal(plan.summary.compileAllowed, false);
    assert.equal(plan.plan.executionEnabled, false);
    assert.equal(plan.plan.artifactTarget.graphJson.willWrite, false);

    const postResponse = await fetch(
      `${rootUrl}/api/kb/admin/graph/compile-plan`,
      {
        method: "POST",
      },
    );
    assert.equal(postResponse.status, 405);
  });

  assert.deepEqual(snapshotEntries(projectRoot), beforeEntries);
});

test("admin graph compile plan reports malformed config as structured status", async () => {
  const projectRoot = makeProject();
  const configDir = path.join(projectRoot, ".project-wiki");
  fs.mkdirSync(configDir, { recursive: true });
  fs.writeFileSync(
    path.join(configDir, "project-wiki.config.json"),
    "{ broken",
  );

  await withAdmin(projectRoot, async (baseUrl) => {
    const rootUrl = baseUrl.replace(/\/admin$/, "");
    const response = await fetch(`${rootUrl}/api/kb/admin/graph/compile-plan`);
    const body = await readJson(response);

    assert.equal(response.status, 200);
    assert.equal(body.ok, true);
    assert.equal(body.readOnly, true);
    assert.equal(body.phase, "p4_3_graph_compile_planning");
    assert.equal(body.binding.status, "invalid_config");
    assert.equal(body.adapter.state, "env_unavailable");
    assert.doesNotMatch(JSON.stringify(body), /INTERNAL_ERROR/);
  });
});

test("admin exposes read-only source normalization import plan", async () => {
  const projectRoot = makeProject();
  writeText(
    projectRoot,
    ".project-wiki/admin/retain-pdf/markdown/full.md",
    "# Book\n",
  );
  writeText(
    projectRoot,
    ".project-wiki/admin/retain-pdf/artifacts-manifest.json",
    JSON.stringify(
      {
        artifacts: [
          {
            path: ".project-wiki/admin/retain-pdf/markdown/full.md",
            type: "markdown",
          },
        ],
      },
      null,
      2,
    ),
  );
  writeConfig(projectRoot, {
    version: 1,
    projectType: "document-corpus",
    wikiRoot: ".project-wiki/wiki",
    adminRoot: ".project-wiki/admin",
    rawSourceRoots: ["docs"],
    writeWhitelist: [".project-wiki/admin/**", ".project-wiki/backups/**"],
    optionalAdapters: {
      retainPdf: {
        manifestPath: ".project-wiki/admin/retain-pdf/artifacts-manifest.json",
      },
    },
  });
  const beforeEntries = snapshotEntries(projectRoot);

  await withAdmin(projectRoot, async (baseUrl) => {
    const rootUrl = baseUrl.replace(/\/admin$/, "");
    const health = await readJson(
      await fetch(`${rootUrl}/api/kb/admin/health`),
    );
    assert.equal(health.features.sourceNormalizationImportPlanning, true);
    assert.equal(health.features.import, false);

    const plan = await readJson(
      await fetch(`${rootUrl}/api/kb/admin/source-normalization/import-plan`),
    );
    assert.equal(plan.ok, true);
    assert.equal(plan.readOnly, true);
    assert.equal(plan.phase, "p4_2_source_normalization_import_planning");
    assert.equal(plan.adapter.state, "configured");
    assert.equal(plan.summary.importable, 1);
    assert.equal(plan.plan.executionEnabled, false);
    assert.equal(plan.plan.proposedRegistryTarget.willWrite, false);

    const postResponse = await fetch(
      `${rootUrl}/api/kb/admin/source-normalization/import-plan`,
      { method: "POST" },
    );
    assert.equal(postResponse.status, 405);
  });

  assert.deepEqual(snapshotEntries(projectRoot), beforeEntries);
});

test("admin source normalization import plan reports malformed config as structured status", async () => {
  const projectRoot = makeProject();
  const configDir = path.join(projectRoot, ".project-wiki");
  fs.mkdirSync(configDir, { recursive: true });
  fs.writeFileSync(
    path.join(configDir, "project-wiki.config.json"),
    "{ broken",
  );

  await withAdmin(projectRoot, async (baseUrl) => {
    const rootUrl = baseUrl.replace(/\/admin$/, "");
    const response = await fetch(
      `${rootUrl}/api/kb/admin/source-normalization/import-plan`,
    );
    const body = await readJson(response);

    assert.equal(response.status, 200);
    assert.equal(body.ok, true);
    assert.equal(body.readOnly, true);
    assert.equal(body.phase, "p4_2_source_normalization_import_planning");
    assert.equal(body.binding.status, "invalid_config");
    assert.equal(body.adapter.state, "env_unavailable");
    assert.doesNotMatch(JSON.stringify(body), /INTERNAL_ERROR/);
  });
});

test("admin exposes read-only export plan", async () => {
  const projectRoot = makeProject();
  writeText(
    projectRoot,
    ".project-wiki/admin/export-plan.json",
    JSON.stringify(
      {
        target: "static-site",
        profile: "quartz",
        outputRoot: ".project-wiki/export/site",
        rollback: { strategy: "remove_generated_output" },
      },
      null,
      2,
    ),
  );
  writeConfig(projectRoot, {
    version: 1,
    projectType: "document-corpus",
    wikiRoot: ".project-wiki/wiki",
    adminRoot: ".project-wiki/admin",
    rawSourceRoots: ["docs"],
    writeWhitelist: [".project-wiki/admin/**", ".project-wiki/backups/**"],
    optionalAdapters: {
      export: {
        planFile: ".project-wiki/admin/export-plan.json",
      },
    },
  });
  const beforeEntries = snapshotEntries(projectRoot);

  await withAdmin(projectRoot, async (baseUrl) => {
    const rootUrl = baseUrl.replace(/\/admin$/, "");
    const health = await readJson(
      await fetch(`${rootUrl}/api/kb/admin/health`),
    );
    assert.equal(health.features.exportPlanning, true);
    assert.equal(health.features.export, false);

    const plan = await readJson(
      await fetch(`${rootUrl}/api/kb/admin/export/plan`),
    );
    assert.equal(plan.ok, true);
    assert.equal(plan.readOnly, true);
    assert.equal(plan.phase, "p4_4_export_planning");
    assert.equal(plan.adapter.state, "configured");
    assert.equal(plan.summary.exportAllowed, false);
    assert.equal(plan.plan.exportEndpointAvailable, false);
    assert.equal(plan.plan.executionEnabled, false);
    assert.equal(plan.plan.outputRoot.willWrite, false);

    const postResponse = await fetch(`${rootUrl}/api/kb/admin/export/plan`, {
      method: "POST",
    });
    assert.equal(postResponse.status, 405);
  });

  assert.deepEqual(snapshotEntries(projectRoot), beforeEntries);
});

test("admin export plan reports malformed config as structured status", async () => {
  const projectRoot = makeProject();
  const configDir = path.join(projectRoot, ".project-wiki");
  fs.mkdirSync(configDir, { recursive: true });
  fs.writeFileSync(
    path.join(configDir, "project-wiki.config.json"),
    "{ broken",
  );

  const beforeEntries = snapshotEntries(projectRoot);

  await withAdmin(projectRoot, async (baseUrl) => {
    const rootUrl = baseUrl.replace(/\/admin$/, "");
    const response = await fetch(`${rootUrl}/api/kb/admin/export/plan`);
    const body = await readJson(response);

    assert.equal(response.status, 200);
    assert.equal(body.ok, true);
    assert.equal(body.readOnly, true);
    assert.equal(body.phase, "p4_4_export_planning");
    assert.equal(body.binding.status, "invalid_config");
    assert.equal(body.adapter.state, "env_unavailable");
    assert.equal(body.plan.executionEnabled, false);
    assert.equal(body.plan.sourceScope.status, "needs_confirmation");
    assert.ok(Array.isArray(body.plan.sourceScope.roots));
    assert.equal(body.summary.exportAllowed, false);
    assert.doesNotMatch(JSON.stringify(body), /INTERNAL_ERROR/);
  });

  assert.deepEqual(snapshotEntries(projectRoot), beforeEntries);
});

test("admin curation preview is read-only and apply writes only curation artifacts", async () => {
  const projectRoot = createConfiguredProject();

  await withAdmin(projectRoot, async (baseUrl, server) => {
    const rootUrl = baseUrl.replace(/\/admin$/, "");
    const operation = {
      type: "manual_override_append",
      actor: "local-admin",
      entry: {
        targetPath: ".project-wiki/wiki/topic.md",
        field: "category",
        value: "reference",
        reason: "Browser curation smoke.",
      },
    };
    const beforePreview = snapshotEntries(projectRoot);
    const noToken = await fetch(`${rootUrl}/api/kb/admin/curation/preview`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ operation }),
    });
    assert.equal(noToken.status, 403);

    const wrongType = await fetch(`${rootUrl}/api/kb/admin/curation/preview`, {
      method: "POST",
      headers: {
        "content-type": "text/plain",
        "x-project-wiki-admin-token": server.ready.writeToken,
      },
      body: JSON.stringify({ operation }),
    });
    assert.equal(wrongType.status, 415);

    const previewResponse = await fetch(
      `${rootUrl}/api/kb/admin/curation/preview`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-project-wiki-admin-token": server.ready.writeToken,
        },
        body: JSON.stringify({ operation }),
      },
    );
    const preview = await readJson(previewResponse);

    assert.equal(previewResponse.status, 200);
    assert.equal(preview.ok, true);
    assert.equal(preview.readOnly, true);
    assert.match(preview.previewId, /^[a-f0-9]{64}$/);
    assert.ok(
      preview.affectedFiles.some(
        (file) => file.path === ".project-wiki/admin/manual-overrides.json",
      ),
    );
    assert.deepEqual(snapshotEntries(projectRoot), beforePreview);

    const applyResponse = await fetch(
      `${rootUrl}/api/kb/admin/curation/apply`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-project-wiki-admin-token": server.ready.writeToken,
        },
        body: JSON.stringify({
          operation,
          confirmed: true,
          previewId: preview.previewId,
        }),
      },
    );
    const applied = await readJson(applyResponse);

    assert.equal(applyResponse.status, 200);
    assert.equal(applied.ok, true);
    assert.equal(applied.applied, true);
    const entries = snapshotEntries(projectRoot);
    assert.ok(
      entries.some((entry) =>
        entry.startsWith(".project-wiki/admin/manual-overrides.json:"),
      ),
    );
    assert.ok(
      entries.some((entry) =>
        entry.startsWith(".project-wiki/admin/admin-log.md:"),
      ),
    );
    assert.ok(
      entries.some((entry) => entry.includes(".project-wiki/backups/")),
    );
    assert.equal(
      entries.find((entry) => entry.startsWith("docs/source.md:")),
      beforePreview.find((entry) => entry.startsWith("docs/source.md:")),
    );
  });
});
test("admin rejects invalid preview ids and non-curation write endpoints without mutation", async () => {
  const projectRoot = createConfiguredProject();
  const beforeEntries = snapshotEntries(projectRoot);

  await withAdmin(projectRoot, async (baseUrl) => {
    const rootUrl = baseUrl.replace(/\/admin$/, "");
    const traversal = await fetch(
      `${rootUrl}/api/kb/admin/item/${encodeURIComponent("../outside.md")}`,
    );
    assert.equal(traversal.status, 400);
    const traversalBody = await readJson(traversal);
    assert.equal(traversalBody.ok, false);

    const malformed = await fetch(`${rootUrl}/api/kb/admin/item/%E0%A4%A`);
    assert.equal(malformed.status, 400);
    const malformedBody = await readJson(malformed);
    assert.equal(malformedBody.error, "INVALID_ITEM_ID");

    for (const [method, endpoint] of [
      ["POST", "/api/kb/admin/curation"],
      ["POST", "/api/kb/admin/source-policies"],
      ["POST", "/api/kb/admin/retrieval-presets"],
      ["POST", "/api/kb/admin/backup"],
      ["POST", "/api/kb/admin/restore"],
      ["DELETE", "/api/kb/admin/item/topic"],
    ]) {
      const response = await fetch(`${rootUrl}${endpoint}`, { method });
      assert.ok([404, 405].includes(response.status));
    }
  });

  assert.deepEqual(snapshotEntries(projectRoot), beforeEntries);
});
