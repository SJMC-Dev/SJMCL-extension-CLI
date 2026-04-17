import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import semver from "semver";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const packageJsonPath = path.join(projectRoot, "package.json");
const packageLockPath = path.join(projectRoot, "package-lock.json");

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function main() {
  const target = process.argv[2];
  if (!target) {
    throw new Error("Missing target version. Use a full semantic version such as 1.2.3.");
  }

  const nextVersion = semver.valid(target);
  if (!nextVersion) {
    throw new Error(`Invalid semantic version: ${target}`);
  }

  const packageJson = readJson(packageJsonPath);
  const packageLock = readJson(packageLockPath);

  packageJson.version = nextVersion;
  packageLock.version = nextVersion;

  if (packageLock.packages?.[""]) {
    packageLock.packages[""].version = nextVersion;
  }

  writeJson(packageJsonPath, packageJson);
  writeJson(packageLockPath, packageLock);

  console.log(`Version bumped to ${nextVersion}`);
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Bump failed: ${message}`);
  process.exitCode = 1;
}
