import fs from "node:fs";
import path from "node:path";

export const MAX_CONFIG_BYTES = 500_000;

export const DEFAULT_CONFIG_STATUS = {
  path: ".project-wiki/project-wiki.config.json",
  exists: false,
};

export const RECOGNIZED_PROJECT_TYPES = [
  "software-repo",
  "document-corpus",
  "teaching-kb",
  "ai-knowledge-app",
  "product-business-kb",
  "mixed",
];

export class RuntimeConfigError extends Error {
  constructor(status, code, details = {}) {
    super(code);
    this.name = "RuntimeConfigError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function toDisplayPath(value) {
  return value.replaceAll(path.sep, "/");
}

export function isInsideRoot(candidate, root) {
  const relative = path.relative(root, candidate);
  return (
    relative === "" ||
    (!relative.startsWith("..") && !path.isAbsolute(relative))
  );
}

export function errorToHealth(error) {
  if (!(error instanceof RuntimeConfigError)) {
    throw error;
  }

  return {
    status: error.status,
    readOnly: true,
    projectRoot: error.details.projectRoot ?? null,
    config: error.details.config ?? DEFAULT_CONFIG_STATUS,
    errors: [{ code: error.code, field: error.details.field }].filter(Boolean),
    warnings: [],
  };
}

export function resolveProjectRoot(projectRootInput) {
  const projectRoot = path.resolve(projectRootInput ?? process.cwd());

  if (!fs.existsSync(projectRoot)) {
    throw new RuntimeConfigError(
      "invalid_project_root",
      "PROJECT_ROOT_MISSING",
    );
  }

  if (!fs.statSync(projectRoot).isDirectory()) {
    throw new RuntimeConfigError(
      "invalid_project_root",
      "PROJECT_ROOT_NOT_DIRECTORY",
    );
  }

  return fs.realpathSync.native(projectRoot);
}

export function loadProjectBinding(projectRootInput) {
  const realProjectRoot = resolveProjectRoot(projectRootInput);
  const configPath = path.join(
    realProjectRoot,
    ".project-wiki",
    "project-wiki.config.json",
  );

  if (!fs.existsSync(configPath)) {
    return {
      health: {
        status: "needs_binding",
        readOnly: true,
        projectRoot: realProjectRoot,
        config: DEFAULT_CONFIG_STATUS,
        nextSteps: [
          "Propose .project-wiki/project-wiki.config.json binding before writing files.",
          "Confirm source roots, wiki root, admin root, and write whitelist.",
        ],
      },
      projectRoot: realProjectRoot,
      config: null,
      paths: null,
      rawSourceRoots: [],
      writeWhitelist: [],
    };
  }

  const configStatus = {
    path: ".project-wiki/project-wiki.config.json",
    exists: true,
  };
  const configStat = fs.lstatSync(configPath);
  if (configStat.isSymbolicLink()) {
    throw new RuntimeConfigError("invalid_config", "CONFIG_PATH_IS_SYMLINK", {
      config: configStatus,
      projectRoot: realProjectRoot,
    });
  }

  if (!configStat.isFile()) {
    throw new RuntimeConfigError("invalid_config", "CONFIG_PATH_NOT_FILE", {
      config: configStatus,
      projectRoot: realProjectRoot,
    });
  }

  if (configStat.size > MAX_CONFIG_BYTES) {
    throw new RuntimeConfigError("invalid_config", "CONFIG_FILE_TOO_LARGE", {
      config: configStatus,
      projectRoot: realProjectRoot,
    });
  }

  const realConfigPath = fs.realpathSync.native(configPath);
  if (!isInsideRoot(realConfigPath, realProjectRoot)) {
    throw new RuntimeConfigError(
      "invalid_config",
      "CONFIG_PATH_OUTSIDE_PROJECT",
      {
        config: configStatus,
        projectRoot: realProjectRoot,
      },
    );
  }

  let config;
  try {
    config = JSON.parse(fs.readFileSync(realConfigPath, "utf8"));
  } catch {
    throw new RuntimeConfigError("invalid_config", "INVALID_CONFIG_JSON", {
      config: configStatus,
      projectRoot: realProjectRoot,
    });
  }

  if (!config || typeof config !== "object" || Array.isArray(config)) {
    throw new RuntimeConfigError("invalid_config", "CONFIG_ROOT_INVALID_TYPE", {
      config: configStatus,
      projectRoot: realProjectRoot,
    });
  }

  const tools = createPathTools(realProjectRoot);
  const wikiRoot = config.wikiRoot ?? ".project-wiki/wiki";
  const adminRoot = config.adminRoot ?? ".project-wiki/admin";
  const knowledgeRoot = config.knowledgeRoot ?? ".project-wiki/knowledge";
  const backupRoot = config.backupRoot ?? ".project-wiki/backups";
  const rawSourceRoots = Array.isArray(config.rawSourceRoots)
    ? config.rawSourceRoots
    : [];
  const writeWhitelist = Array.isArray(config.writeWhitelist)
    ? config.writeWhitelist
    : [];

  const rawSourceRecords = rawSourceRoots.map((entry, index) =>
    tools.safePathStatus(entry, `rawSourceRoots[${index}]`),
  );
  const pathRecords = {
    wikiRoot: tools.safePathStatus(wikiRoot, "wikiRoot"),
    adminRoot: tools.safePathStatus(adminRoot, "adminRoot"),
    knowledgeRoot: tools.safePathStatus(knowledgeRoot, "knowledgeRoot"),
    backupRoot: tools.safePathStatus(backupRoot, "backupRoot"),
  };
  rejectInvalidPathRecords(pathRecords, rawSourceRecords, realProjectRoot);
  const normalizedWriteWhitelist = writeWhitelist.map((entry, index) =>
    tools.validateWriteWhitelistEntry(entry, index),
  );

  const warnings = [];
  if (!config.projectType) warnings.push("projectType is missing");
  if (rawSourceRoots.length === 0) warnings.push("rawSourceRoots is empty");
  if (writeWhitelist.length === 0) warnings.push("writeWhitelist is empty");
  for (const [name, value] of Object.entries(pathRecords)) {
    if (!value.valid) warnings.push(`${name} is invalid: ${value.reason}`);
    else if (!value.exists)
      warnings.push(`${name} does not exist: ${value.path}`);
  }
  for (const source of rawSourceRecords) {
    if (!source.valid) warnings.push(`raw source is invalid: ${source.reason}`);
    else if (!source.exists)
      warnings.push(`raw source does not exist: ${source.path}`);
  }

  const publicPaths = Object.fromEntries(
    Object.entries(pathRecords).map(([name, value]) => [
      name,
      toPublicPath(value),
    ]),
  );
  const publicRawSourceRoots = rawSourceRecords.map(toPublicPath);
  const health = {
    status: warnings.length > 0 ? "configured_with_warnings" : "configured",
    readOnly: true,
    projectRoot: realProjectRoot,
    config: {
      path: toDisplayPath(path.relative(realProjectRoot, realConfigPath)),
      exists: true,
    },
    projectType: {
      value: config.projectType ?? null,
      recognized: RECOGNIZED_PROJECT_TYPES.includes(config.projectType),
    },
    paths: publicPaths,
    rawSourceRoots: publicRawSourceRoots,
    writeWhitelist: {
      values: normalizedWriteWhitelist,
      empty: normalizedWriteWhitelist.length === 0,
    },
    warnings,
  };

  return {
    health,
    projectRoot: realProjectRoot,
    config,
    configPath: realConfigPath,
    paths: pathRecords,
    rawSourceRoots: rawSourceRecords,
    writeWhitelist: normalizedWriteWhitelist,
  };
}

export function inspectProjectBinding(projectRootInput) {
  return loadProjectBinding(projectRootInput).health;
}

function createPathTools(realProjectRoot) {
  function validateRelativePath(value, fieldName) {
    if (typeof value !== "string" || value.length === 0) {
      throw new RuntimeConfigError(
        "invalid_config",
        "CONFIG_PATH_INVALID_TYPE",
        {
          field: fieldName,
          projectRoot: realProjectRoot,
        },
      );
    }

    if (
      path.isAbsolute(value) ||
      hasWindowsDrivePrefix(value) ||
      hasUncPrefix(value) ||
      hasParentTraversal(value)
    ) {
      throw new RuntimeConfigError(
        "invalid_config",
        "CONFIG_PATH_OUTSIDE_PROJECT",
        {
          field: fieldName,
          projectRoot: realProjectRoot,
        },
      );
    }

    const normalized = value.replaceAll("\\", "/");
    const resolved = path.resolve(realProjectRoot, normalized);
    if (!isInsideRoot(resolved, realProjectRoot)) {
      throw new RuntimeConfigError(
        "invalid_config",
        "CONFIG_PATH_OUTSIDE_PROJECT",
        {
          field: fieldName,
          projectRoot: realProjectRoot,
        },
      );
    }

    return { original: normalized, resolved };
  }

  function inspectManagedPath(resolved) {
    if (!isInsideRoot(resolved, realProjectRoot)) {
      return { exists: false, valid: false, reason: "PATH_OUTSIDE_PROJECT" };
    }

    const relative = path.relative(realProjectRoot, resolved);
    if (relative === "") {
      return { exists: true, valid: true };
    }

    const parts = relative.split(path.sep).filter(Boolean);
    for (let index = 0; index < parts.length; index += 1) {
      const currentPath = path.join(
        realProjectRoot,
        ...parts.slice(0, index + 1),
      );
      let stat;
      try {
        stat = fs.lstatSync(currentPath);
      } catch (error) {
        if (error.code === "ENOENT" || error.code === "ENOTDIR") {
          return { exists: false, valid: true };
        }
        return { exists: false, valid: false, reason: "PATH_UNREADABLE" };
      }

      if (stat.isSymbolicLink()) {
        return { exists: true, valid: false, reason: "PATH_IS_SYMLINK" };
      }

      const realCurrentPath = fs.realpathSync.native(currentPath);
      if (!isInsideRoot(realCurrentPath, realProjectRoot)) {
        return { exists: true, valid: false, reason: "PATH_OUTSIDE_PROJECT" };
      }
    }

    return { exists: true, valid: true };
  }

  function safePathStatus(value, fieldName) {
    const checked = validateRelativePath(value, fieldName);
    const inspection = inspectManagedPath(checked.resolved);
    return {
      path: checked.original,
      resolved: checked.resolved,
      exists: inspection.exists,
      valid: inspection.valid,
      ...(inspection.reason ? { reason: inspection.reason } : {}),
    };
  }

  function validateWriteWhitelistEntry(value, index) {
    if (typeof value !== "string" || value.length === 0) {
      throw new RuntimeConfigError(
        "invalid_config",
        "WRITE_WHITELIST_INVALID_TYPE",
        {
          field: `writeWhitelist[${index}]`,
          projectRoot: realProjectRoot,
        },
      );
    }

    const normalized = value.replaceAll("\\", "/");
    if (
      path.isAbsolute(normalized) ||
      hasWindowsDrivePrefix(normalized) ||
      hasUncPrefix(normalized) ||
      hasParentTraversal(normalized)
    ) {
      throw new RuntimeConfigError(
        "invalid_config",
        "CONFIG_PATH_OUTSIDE_PROJECT",
        {
          field: `writeWhitelist[${index}]`,
          projectRoot: realProjectRoot,
        },
      );
    }

    const wildcardCount = Array.from(normalized.matchAll(/[*]/g)).length;
    if (
      wildcardCount > 2 ||
      (wildcardCount === 1 && !normalized.endsWith("*"))
    ) {
      throw new RuntimeConfigError(
        "invalid_config",
        "WRITE_WHITELIST_INVALID_GLOB",
        {
          field: `writeWhitelist[${index}]`,
          projectRoot: realProjectRoot,
        },
      );
    }

    if (wildcardCount === 2 && !normalized.endsWith("**")) {
      throw new RuntimeConfigError(
        "invalid_config",
        "WRITE_WHITELIST_INVALID_GLOB",
        {
          field: `writeWhitelist[${index}]`,
          projectRoot: realProjectRoot,
        },
      );
    }

    const firstWildcard = normalized.indexOf("*");
    const base =
      firstWildcard === -1
        ? normalized
        : normalized.slice(0, firstWildcard).replace(/\/$/, "") || ".";
    const checked = validateRelativePath(base, `writeWhitelist[${index}]`);
    const inspection = inspectManagedPath(checked.resolved);
    if (!inspection.valid) {
      throw new RuntimeConfigError(
        "invalid_config",
        "WRITE_WHITELIST_PATH_INVALID",
        {
          field: `writeWhitelist[${index}]`,
          projectRoot: realProjectRoot,
        },
      );
    }

    return normalized;
  }

  return {
    validateRelativePath,
    inspectManagedPath,
    safePathStatus,
    validateWriteWhitelistEntry,
  };
}

function rejectInvalidPathRecords(pathRecords, rawSourceRecords, projectRoot) {
  for (const [field, record] of Object.entries(pathRecords)) {
    if (!record.valid) {
      throw new RuntimeConfigError(
        "invalid_config",
        managedPathErrorCode(record),
        {
          field,
          projectRoot,
        },
      );
    }
  }

  for (const [index, record] of rawSourceRecords.entries()) {
    if (!record.valid) {
      throw new RuntimeConfigError(
        "invalid_config",
        managedPathErrorCode(record),
        {
          field: `rawSourceRoots[${index}]`,
          projectRoot,
        },
      );
    }
  }
}

function managedPathErrorCode(record) {
  return record.reason === "PATH_IS_SYMLINK"
    ? "CONFIG_PATH_IS_SYMLINK"
    : "CONFIG_PATH_OUTSIDE_PROJECT";
}

function toPublicPath(value) {
  const { resolved, ...publicValue } = value;
  return publicValue;
}

function hasWindowsDrivePrefix(value) {
  return /^[A-Za-z]:[\\/]/.test(value);
}

function hasUncPrefix(value) {
  return value.startsWith("//") || value.startsWith("\\\\");
}

function hasParentTraversal(value) {
  return value.replaceAll("\\", "/").split("/").includes("..");
}
