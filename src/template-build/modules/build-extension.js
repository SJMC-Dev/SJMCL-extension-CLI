import { zipSync } from "fflate";
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { addDirectoryToZipTree, copyIfExists, readJson } from "./project-files.js";
import { assertNoDirectSingletonImports } from "./source-analysis.js";
import { warnBundledSingletonDependencies } from "./singleton-analysis.js";

export function createEsbuildOptions(sourceEntryPath, buildMode, {
  obfuscate = false,
  logLevel = "info",
} = {}) {
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
    logLevel,
  };
}

export function writeExtensionOutput({
  projectRoot,
  outputDirectory,
  frontendEntry,
  manifest,
  packageJsonPath,
  buildResult,
  compress = false,
  quiet = false,
}) {
  const outputEntry = path.join(outputDirectory, frontendEntry);

  // Preserve runtime data directory across rebuilds
  const outputDataDir = path.join(outputDirectory, "data");
  const tempDataBackup = path.join(tmpdir(), `sjmcl-data-${manifest.identifier}`);
  if (existsSync(outputDataDir)) {
    cpSync(outputDataDir, tempDataBackup, { recursive: true });
  }

  // clean and recreate output directory
  if (existsSync(outputDirectory)) {
    rmSync(outputDirectory, { recursive: true, force: true });
  }
  mkdirSync(path.dirname(outputEntry), { recursive: true });

  assertNoDirectSingletonImports(projectRoot, quiet);

  const outputFile = buildResult.outputFiles?.[0];
  if (!outputFile) {
    throw new Error("esbuild did not produce a bundled frontend script.");
  }

  warnBundledSingletonDependencies(buildResult.metafile, quiet);

  const bundledScript = outputFile.text.replace(
    /^(?:﻿)?(?:"use strict"|'use strict');\s*/,
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

  // Restore runtime data on top of seed data from project root
  if (existsSync(tempDataBackup)) {
    mkdirSync(outputDataDir, { recursive: true });
    cpSync(tempDataBackup, outputDataDir, { recursive: true });
    rmSync(tempDataBackup, { recursive: true, force: true });
  }

  let archivePath;

  if (compress) {
    const packageJson = readJson(packageJsonPath);
    const version = manifest.version || packageJson.version;
    archivePath = path.join(
      outputDirectory,
      "..",
      `${manifest.identifier}-${version}.sjmclx`
    );
    const zipTree = {
      [manifest.identifier]: addDirectoryToZipTree(outputDirectory),
    };
    const archiveBuffer = zipSync(zipTree, { level: 9 });
    writeFileSync(archivePath, Buffer.from(archiveBuffer));
  }

  return { outputEntry, bundledScript, archivePath };
}
