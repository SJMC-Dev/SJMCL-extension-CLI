import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { FORBIDDEN_IMPORT_TARGETS, HOST_PROVIDED_SINGLETON_DOCS, JSX_PATTERN } from "./constants.js";
import { collectSourceFiles, toProjectRelativePath } from "./project-files.js";
import { formatWarningLabel } from "./utils.js";

function getForbiddenImportCounts(content) {
  const importMatches = content.matchAll(
    /^\s*import(?:["'\s\S]*?\sfrom\s*)?["']([^"']+)["'];?/gm
  );
  const importCounts = new Map();

  for (const match of importMatches) {
    const packageName = match[1];
    if (!FORBIDDEN_IMPORT_TARGETS.has(packageName)) {
      continue;
    }

    importCounts.set(packageName, (importCounts.get(packageName) || 0) + 1);
  }

  return importCounts;
}

function collectForbiddenPackageImports(projectRoot, sourcePath, importCounts) {
  const relativePath = toProjectRelativePath(projectRoot, sourcePath);
  const violations = [];

  for (const [packageName, count] of importCounts) {
    const replacement = FORBIDDEN_IMPORT_TARGETS.get(packageName);
    const importLabel = count === 1 ? "import" : "imports";

    violations.push(
      `${relativePath}: ${count} ${importLabel} from "${packageName}" -> migrate to ${replacement}`
    );
  }

  return violations;
}

function warnJsxTransform(projectRoot, sourcePath, content) {
  if (!/\.[jt]sx$/.test(sourcePath) || !JSX_PATTERN.test(content)) {
    return;
  }

  const relativePath = toProjectRelativePath(projectRoot, sourcePath);
  console.warn(
    `${formatWarningLabel()} JSX/TSX component trees in ${relativePath} will be transformed to React.createElement(...).`
  );
}

function scanSourceWarnings(projectRoot) {
  const sourceRoot = path.join(projectRoot, "src");
  if (!existsSync(sourceRoot)) {
    return [];
  }

  const violations = [];

  for (const sourcePath of collectSourceFiles(sourceRoot)) {
    const content = readFileSync(sourcePath, "utf8");
    const importCounts = getForbiddenImportCounts(content);

    violations.push(
      ...collectForbiddenPackageImports(projectRoot, sourcePath, importCounts)
    );
    warnJsxTransform(projectRoot, sourcePath, content);
  }

  return violations;
}

export function assertNoDirectSingletonImports(projectRoot) {
  const violations = scanSourceWarnings(projectRoot);

  if (violations.length === 0) {
    return;
  }

  throw new Error(
    [
      "Extensions must not import host-provided singleton dependencies directly.",
      'Found imports that must be migrated from "react" / "@chakra-ui/react" to the injected extension API:',
      ...violations.map((violation) => `- ${violation}`),
      `See ${HOST_PROVIDED_SINGLETON_DOCS}`,
    ].join("\n")
  );
}
