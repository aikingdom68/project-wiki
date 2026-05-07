#!/usr/bin/env node
import { inspectExportPlan } from "./lib/export-plan.mjs";
import { errorToHealth, RuntimeConfigError } from "./lib/runtime-config.mjs";

function writeJson(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

try {
  writeJson(inspectExportPlan(process.argv[2] ?? process.cwd()));
} catch (error) {
  if (!(error instanceof RuntimeConfigError)) {
    throw error;
  }

  writeJson(errorToHealth(error));
  console.error(error.code);
  process.exit(1);
}
