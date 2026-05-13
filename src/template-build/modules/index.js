import { build } from "esbuild";
import semver from "semver";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { IDENTIFIER_PATTERN } from "./constants.js";
import { validateRelativePackagePath } from "./utils.js";
import { readJson, resolveSourceEntryPath } from "./project-files.js";
import { resolveBuildOptions } from "./build-options.js";
import { createEsbuildOptions, writeExtensionOutput } from "./build-extension.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const manifestPath = path.join(projectRoot, "sjmcl.ext.json");
const packagePath = path.join(projectRoot, "package.json");
const distRoot = path.join(projectRoot, "dist");

async function main() {
  const manifest = readJson(manifestPath);
  const packageJson = readJson(packagePath);
  const sourceEntryPath = resolveSourceEntryPath(projectRoot);
  const { buildMode, obfuscate, quiet } = resolveBuildOptions(process.argv.slice(2));

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

  const buildResult = await build(
    createEsbuildOptions(sourceEntryPath, buildMode, { obfuscate })
  );

  const { archivePath } = writeExtensionOutput({
    projectRoot,
    outputDirectory,
    frontendEntry,
    manifest,
    packageJsonPath: packagePath,
    buildResult,
    compress: true,
    quiet,
  });

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
