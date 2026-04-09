#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();
const requiredFiles = [
  "SKILL.md",
  "README.md",
  "LICENSE",
  "CHANGELOG.md",
  "RELEASE.md",
  "PUBLISHING.md",
  "ROADMAP.md",
  "contracts/source-policy.schema.json",
  "contracts/output-contract.schema.json",
  "references/llm-wiki-core.md",
  "references/local-rag-engineering.md",
  "references/project-assistant-playbook.md",
  "references/modes-and-safety.md",
  "references/source-priority-guidance.md",
  "references/system-integration-guidance.md",
  "references/evidence-and-citation.md",
  "references/wiki-quality-audit.md",
  "references/incremental-update-protocol.md",
  "references/templates/overview-page.md",
  "references/templates/module-page.md",
  "references/templates/decision-page.md",
  "references/templates/glossary-page.md",
  "references/templates/troubleshooting-page.md",
  "examples/explain-project.md",
  "examples/source-guided-explain.md",
  "examples/build-wiki-plan.md",
  "examples/compare-options.md",
  "scripts/doctor.mjs",
  "scripts/install.mjs",
  "evals/README.md",
  "evals/cases/source-guided-example-bank.json",
  "evals/cases/project-explanation-basic.json",
  "evals/cases/compare-options-local-evidence.json",
];

let ok = true;
for (const rel of requiredFiles) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) {
    ok = false;
    console.error(`MISSING: ${rel}`);
    continue;
  }
  const stat = fs.lstatSync(p);
  if (!stat.isFile()) {
    ok = false;
    console.error(`NOT_A_FILE: ${rel}`);
    continue;
  }
  if (stat.size === 0) {
    ok = false;
    console.error(`EMPTY_FILE: ${rel}`);
  }
}

if (ok) {
  console.log("project-wiki doctor: OK");
  process.exit(0);
}
process.exit(1);
