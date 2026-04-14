import { build } from "esbuild";
import { zipSync } from "fflate";
import semver from "semver";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const manifestPath = path.join(projectRoot, "sjmcl.ext.json");
const packagePath = path.join(projectRoot, "package.json");
const sourceEntryPath = path.join(projectRoot, "src", "index.ts");
const distRoot = path.join(projectRoot, "dist");

const IDENTIFIER_PATTERN = /^[a-z][a-z0-9_-]*(\.[a-z][a-z0-9_-]*)+$/;

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function normalizeRelativePath(value) {
  return String(value || "")
    .replace(/\\/g, "/")
    .trim();
}

function validateRelativePackagePath(value, fieldName) {
  const normalized = normalizeRelativePath(value);

  if (!normalized) {
    throw new Error(`${fieldName} is required.`);
  }

  if (normalized.startsWith("/") || normalized.startsWith("../")) {
    throw new Error(`${fieldName} must stay inside the extension package.`);
  }

  if (normalized.split("/").some((segment) => segment === "" || segment === "..")) {
    throw new Error(`${fieldName} must be a normalized relative path.`);
  }

  if (!normalized.endsWith(".js")) {
    throw new Error(`${fieldName} must point to a .js file.`);
  }

  return normalized;
}

function copyIfExists(sourcePath, targetPath) {
  if (!existsSync(sourcePath)) {
    return;
  }

  cpSync(sourcePath, targetPath, { recursive: true });
}

function addDirectoryToZipTree(sourceDirectory) {
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

async function main() {
  const manifest = readJson(manifestPath);
  const packageJson = readJson(packagePath);

  if (!IDENTIFIER_PATTERN.test(manifest.identifier || "")) {
    throw new Error("sjmcl.ext.json must contain a valid identifier.");
  }

  const frontendEntry = validateRelativePackagePath(
    manifest.frontend?.entry,
    "frontend.entry"
  );

  const version = manifest.version || packageJson.version;
  if (!semver.valid(version)) {
    throw new Error("A valid extension version is required in sjmcl.ext.json or package.json.");
  }

  const outputDirectory = path.join(distRoot, manifest.identifier);
  const outputEntry = path.join(outputDirectory, frontendEntry);
  const archivePath = path.join(
    distRoot,
    `${manifest.identifier}-${version}.sjmclx`
  );

  rmSync(distRoot, { recursive: true, force: true });
  mkdirSync(path.dirname(outputEntry), { recursive: true });

  await build({
    entryPoints: [sourceEntryPath],
    bundle: true,
    format: "iife",
    platform: "browser",
    target: ["es2020"],
    outfile: outputEntry,
    charset: "utf8",
    logLevel: "info",
  });

  writeFileSync(
    path.join(outputDirectory, "sjmcl.ext.json"),
    `${JSON.stringify(manifest, null, 2)}\n`
  );

  copyIfExists(
    path.join(projectRoot, "icon.png"),
    path.join(outputDirectory, "icon.png")
  );
  copyIfExists(
    path.join(projectRoot, "assets"),
    path.join(outputDirectory, "assets")
  );
  copyIfExists(
    path.join(projectRoot, "data"),
    path.join(outputDirectory, "data")
  );

  const zipTree = {
    [manifest.identifier]: addDirectoryToZipTree(outputDirectory),
  };
  const archiveBuffer = zipSync(zipTree, { level: 9 });
  writeFileSync(archivePath, Buffer.from(archiveBuffer));

  console.log("");
  console.log(`Built ${outputDirectory}`);
  console.log(`Packed ${archivePath}`);

  if (packageJson.version !== version) {
    console.log(
      `Note: package.json version (${packageJson.version}) differs from sjmcl.ext.json version (${version}).`
    );
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Build failed: ${message}`);
  process.exitCode = 1;
});
