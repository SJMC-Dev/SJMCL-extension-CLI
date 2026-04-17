import { cpSync, existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { formatWarningLabel, normalizeRelativePath } from "./utils.js";

export function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

export function copyIfExists(sourcePath, targetPath) {
  if (!existsSync(sourcePath)) {
    return;
  }

  cpSync(sourcePath, targetPath, { recursive: true });
}

export function addDirectoryToZipTree(sourceDirectory) {
  const currentNode = {};

  for (const entry of readdirSync(sourceDirectory, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDirectory, entry.name);

    if (entry.isDirectory()) {
      currentNode[entry.name] = addDirectoryToZipTree(sourcePath);
      continue;
    }

    currentNode[entry.name] = readFileSync(sourcePath);
  }

  return currentNode;
}

export function resolveSourceEntryPath(projectRoot) {
  const candidates = [
    path.join(projectRoot, "src", "index.ts"),
    path.join(projectRoot, "src", "index.tsx"),
  ];
  const existingCandidates = candidates.filter((candidate) => existsSync(candidate));

  if (existingCandidates.length === 0) {
    throw new Error("Expected src/index.ts or src/index.tsx.");
  }

  if (existingCandidates.length > 1) {
    console.warn(
      `${formatWarningLabel()} Both src/index.ts and src/index.tsx exist; using src/index.ts.`
    );
  }

  return existingCandidates[0];
}

export function collectSourceFiles(rootDirectory) {
  const files = [];

  for (const entry of readdirSync(rootDirectory, { withFileTypes: true })) {
    const entryPath = path.join(rootDirectory, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(entryPath));
      continue;
    }

    if (/\.(tsx?|jsx?)$/.test(entry.name)) {
      files.push(entryPath);
    }
  }

  return files;
}

export function toProjectRelativePath(projectRoot, sourcePath) {
  return normalizeRelativePath(path.relative(projectRoot, sourcePath));
}
