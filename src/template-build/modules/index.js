import { build } from "esbuild";
import { zipSync } from "fflate";
import semver from "semver";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { IDENTIFIER_PATTERN } from "./constants.js";
import { validateRelativePackagePath } from "./utils.js";
import { addDirectoryToZipTree, copyIfExists, readJson, resolveSourceEntryPath } from "./project-files.js";
import { assertNoDirectSingletonImports } from "./source-analysis.js";
import { warnBundledSingletonDependencies } from "./singleton-analysis.js";
import { resolveBuildOptions } from "./build-options.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const manifestPath = path.join(projectRoot, "sjmcl.ext.json");
const packagePath = path.join(projectRoot, "package.json");
const distRoot = path.join(projectRoot, "dist");

function createEsbuildOptions(sourceEntryPath, buildMode, obfuscate) {
  const shouldMinify = buildMode === "production";

  return {
    entryPoints: [sourceEntryPath],
    bundle: true,
    format: "iife",
    platform: "browser",
    target: ["es2015"],
    write: false,
    charset: "utf8",
    jsx: "transform",
    jsxFactory: "React.createElement",
    jsxFragment: "React.Fragment",
    define: {
      "process.env.NODE_ENV": JSON.stringify(buildMode),
    },
    metafile: true,
    minifySyntax: shouldMinify,
    minifyWhitespace: shouldMinify,
    minifyIdentifiers: obfuscate,
    logLevel: "info",
  };
}

async function main() {
  const manifest = readJson(manifestPath);
  const packageJson = readJson(packagePath);
  const sourceEntryPath = resolveSourceEntryPath(projectRoot);
  const { buildMode, obfuscate } = resolveBuildOptions(process.argv.slice(2));

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
  assertNoDirectSingletonImports(projectRoot);

  const buildResult = await build(
    createEsbuildOptions(sourceEntryPath, buildMode, obfuscate)
  );

  warnBundledSingletonDependencies(buildResult.metafile);

  const outputFile = buildResult.outputFiles?.[0];

  if (!outputFile) {
    throw new Error("esbuild did not produce a bundled frontend script.");
  }

  const bundledScript = outputFile.text.replace(
    /^(?:\uFEFF)?(?:"use strict"|'use strict');\s*/,
    ""
  );

  writeFileSync(outputEntry, bundledScript);
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
