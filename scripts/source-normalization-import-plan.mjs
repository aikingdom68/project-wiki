#!/usr/bin/env node
import { errorToHealth, RuntimeConfigError } from "./lib/runtime-config.mjs";
import { inspectSourceNormalizationImportPlan } from "./lib/source-normalization-import-plan.mjs";

function writeJson(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

try {
  writeJson(
    inspectSourceNormalizationImportPlan(process.argv[2] ?? process.cwd()),
  );
} catch (error) {
  if (!(error instanceof RuntimeConfigError)) {
    throw error;
  }

  writeJson(errorToHealth(error));
  console.error(error.code);
  process.exit(1);
}
