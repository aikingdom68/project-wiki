#!/usr/bin/env node
import { inspectGraphCompilePlan } from "./lib/graph-compile-plan.mjs";
import { errorToHealth, RuntimeConfigError } from "./lib/runtime-config.mjs";

function writeJson(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

try {
  writeJson(inspectGraphCompilePlan(process.argv[2] ?? process.cwd()));
} catch (error) {
  if (!(error instanceof RuntimeConfigError)) {
    throw error;
  }

  writeJson(errorToHealth(error));
  console.error(error.code);
  process.exit(1);
}
