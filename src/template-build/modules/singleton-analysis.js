import { HOST_PROVIDED_SINGLETON_DOCS, HOST_SINGLETON_PACKAGES } from "./constants.js";
import {
  escapeRegExp,
  formatWarningLabel,
  isNodeModulesPath,
  normalizeRelativePath,
} from "./utils.js";

function createNodeModulesPackagePattern(packageName) {
  return new RegExp(`(^|/)node_modules/${escapeRegExp(packageName)}(/|$)`);
}

function getImportParentMap(inputs) {
  const parentMap = new Map();

  for (const [sourcePath, input] of Object.entries(inputs || {})) {
    for (const importedPath of (input.imports || []).map((item) => item.path)) {
      const normalizedImportedPath = normalizeRelativePath(importedPath);
      if (!normalizedImportedPath) {
        continue;
      }

      if (!parentMap.has(normalizedImportedPath)) {
        parentMap.set(normalizedImportedPath, new Set());
      }

      parentMap.get(normalizedImportedPath).add(normalizeRelativePath(sourcePath));
    }
  }

  return parentMap;
}

function reconstructImportChain(startPath, childMap) {
  const chain = [normalizeRelativePath(startPath)];
  let currentPath = normalizeRelativePath(startPath);

  while (childMap.has(currentPath)) {
    currentPath = childMap.get(currentPath);
    chain.push(normalizeRelativePath(currentPath));
  }

  return chain;
}

function findImportChainToProjectSource(sourcePath, parentMap) {
  const queue = [normalizeRelativePath(sourcePath)];
  const visited = new Set(queue);
  const childMap = new Map();

  while (queue.length > 0) {
    const currentPath = queue.shift();
    const parents = parentMap.get(currentPath);

    if (!parents) {
      continue;
    }

    for (const parentPath of parents) {
      if (visited.has(parentPath)) {
        continue;
      }

      visited.add(parentPath);
      childMap.set(parentPath, currentPath);

      if (!isNodeModulesPath(parentPath)) {
        return reconstructImportChain(parentPath, childMap);
      }

      queue.push(parentPath);
    }
  }

  return [normalizeRelativePath(sourcePath)];
}

function formatBytes(value) {
  return new Intl.NumberFormat("en-US").format(value || 0);
}

function getBundledBytesInOutput(metafile, packagePattern) {
  let bytes = 0;

  for (const output of Object.values(metafile?.outputs || {})) {
    for (const [inputPath, info] of Object.entries(output.inputs || {})) {
      if (packagePattern.test(normalizeRelativePath(inputPath))) {
        bytes += info.bytesInOutput || 0;
      }
    }
  }

  return bytes;
}

export function warnBundledSingletonDependencies(metafile) {
  const inputs = metafile?.inputs || {};
  const parentMap = getImportParentMap(inputs);
  const warnings = [];

  for (const rule of HOST_SINGLETON_PACKAGES) {
    const packagePattern = createNodeModulesPackagePattern(rule.packageName);
    const bundledPaths = Object.keys(inputs).filter((inputPath) =>
      packagePattern.test(normalizeRelativePath(inputPath))
    );

    if (bundledPaths.length === 0) {
      continue;
    }

    const outputBytes = getBundledBytesInOutput(metafile, packagePattern);
    const exampleChains = [];

    for (const bundledPath of bundledPaths) {
      const trace = findImportChainToProjectSource(bundledPath, parentMap).join(" -> ");

      if (!exampleChains.includes(trace)) {
        exampleChains.push(trace);
      }

      if (exampleChains.length >= 3) {
        break;
      }
    }

    warnings.push(
      `${rule.packageName}: bundled ${bundledPaths.length} file(s), ${formatBytes(outputBytes)} byte(s) in output; prefer host singleton ${rule.replacement}.` +
        (exampleChains.length > 0
          ? ` Dependency chain(s): ${exampleChains.join("; ")}`
          : "")
    );
  }

  if (warnings.length === 0) {
    return;
  }

  console.warn("");
  console.warn(
    `${formatWarningLabel()} Extension bundle contains host-provided singleton dependencies through third-party packages.`
  );
  console.warn(
    `${formatWarningLabel()} Direct imports from "react" / "@chakra-ui/react" are still forbidden, but transitive bundles only emit warnings so you can inspect the impact.`
  );
  for (const warning of warnings) {
    console.warn(`${formatWarningLabel()} - ${warning}`);
  }
  console.warn(`${formatWarningLabel()} See ${HOST_PROVIDED_SINGLETON_DOCS}`);
}
