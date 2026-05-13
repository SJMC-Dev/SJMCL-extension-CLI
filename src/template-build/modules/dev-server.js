import { context } from "esbuild";
import { exec } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Command, Option } from "commander";
import { IDENTIFIER_PATTERN, RESET, BOLD } from "./constants.js";
import { validateRelativePackagePath, formatWarningLabel } from "./utils.js";
import { readJson, resolveSourceEntryPath } from "./project-files.js";
import { assertNoDirectSingletonImports } from "./source-analysis.js";
import { createEsbuildOptions, writeExtensionOutput } from "./build-extension.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const manifestPath = path.join(projectRoot, "sjmcl.ext.json");
const packagePath = path.join(projectRoot, "package.json");

const GREEN = "\x1b[32m";
const DIM = "\x1b[2m";

function parseBooleanValue(rawValue, label) {
  const normalized = String(rawValue).trim().toLowerCase();

  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  throw new Error(`${label} must be a boolean value.`);
}

function getAppDataDir() {
  switch (process.platform) {
    case "darwin":
      return path.join(os.homedir(), "Library", "Application Support");
    case "win32":
      return process.env.APPDATA || path.join(os.homedir(), "AppData", "Roaming");
    default:
      return process.env.XDG_DATA_HOME || path.join(os.homedir(), ".local", "share");
  }
}

function getDefaultExtensionDir(identifier) {
  return path.join(getAppDataDir(), "SJMCL", "UserContent", "Extensions", identifier);
}

function openUrl(url) {
  const cmd =
    process.platform === "darwin"
      ? `open "${url}"`
      : process.platform === "win32"
        ? `start "" "${url}"`
        : `xdg-open "${url}"`;

  exec(cmd, (error) => {
    if (error) {
      console.warn(`${formatWarningLabel()} Failed to open deeplink: ${error.message}`);
    }
  });
}

function createDevOptionsProgram() {
  return new Command()
    .name("dev")
    .addOption(
      new Option("--mode <mode>", "Build mode")
        .choices(["development", "production"])
        .default("development")
    )
    .addOption(
      new Option("--path <path>", "Custom output directory (default: SJMCL extension directory)")
    )
    .addOption(
      new Option("--compress [compress]", "Also create .sjmclx package")
        .argParser((value) => parseBooleanValue(value, "--compress"))
        .default(false)
    )
    .addOption(
      new Option("--no-reload", "Skip deeplink reload after build")
    )
    .allowUnknownOption(false)
    .allowExcessArguments(false)
    .exitOverride();
}

function parseDevArguments(argv) {
  const program = createDevOptionsProgram();

  try {
    program.parse(argv, { from: "user" });
  } catch (error) {
    if (error?.code === "commander.helpDisplayed") {
      process.exit(0);
    }
    if (error?.code?.startsWith("commander.")) {
      throw new Error(error.message.trim());
    }
    throw error;
  }

  const options = program.opts();

  return {
    mode: options.mode,
    outputPath: options.path,
    compress: options.compress,
    reload: options.reload,
  };
}

async function main() {
  const manifest = readJson(manifestPath);
  const devArgs = parseDevArguments(process.argv.slice(2));

  if (!IDENTIFIER_PATTERN.test(manifest.identifier || "")) {
    throw new Error("sjmcl.ext.json must contain a valid identifier.");
  }

  const frontendEntry = validateRelativePackagePath(
    manifest.frontend?.entry,
    "frontend.entry"
  );

  const sourceEntryPath = resolveSourceEntryPath(projectRoot);
  const outputDirectory = devArgs.outputPath || getDefaultExtensionDir(manifest.identifier);
  const buildMode = devArgs.mode || "development";
  const shouldReload = devArgs.reload !== false;
  const isDefaultPath = !devArgs.outputPath;

  console.log("");
  console.log(`${BOLD}SJMCL Extension Dev Server${RESET}`);
  console.log(`Identifier:  ${manifest.identifier}`);
  console.log(`Output:      ${outputDirectory}`);
  if (isDefaultPath) {
    console.log(`             ${DIM}Extension installed to SJMCL data directory.${RESET}`);
    console.log(`             ${DIM}Make sure the extension is enabled in the launcher (Settings → Extensions).${RESET}`);
  }
  console.log(`Mode:        ${buildMode}`);
  console.log("");

  let isFirstBuild = true;

  const ctx = await context({
    ...createEsbuildOptions(sourceEntryPath, buildMode, { logLevel: "silent" }),
    plugins: [
      {
        name: "sjmcl-dev-server",
        setup(pluginBuild) {
          pluginBuild.onEnd(async (result) => {
            const startTime = Date.now();

            if (result.errors.length > 0) {
              console.error(`${formatWarningLabel()} Build failed with ${result.errors.length} error(s)`);
              return;
            }

            try {
              // Run singleton import check before writing (assertNoDirectSingletonImports
              // is also called inside writeExtensionOutput but we want to fail early here
              // and skip writing if there are violations).
              assertNoDirectSingletonImports(projectRoot, !isFirstBuild);
            } catch (error) {
              console.error(error.message);
              return;
            }

            const { archivePath } = writeExtensionOutput({
              projectRoot,
              outputDirectory,
              frontendEntry,
              manifest,
              packageJsonPath: packagePath,
              buildResult: result,
              compress: devArgs.compress,
              quiet: !isFirstBuild,
            });

            const elapsed = Date.now() - startTime;

            if (isFirstBuild) {
              console.log(`${GREEN}✓${RESET} Built ${outputDirectory} ${DIM}(${elapsed}ms)${RESET}`);
              if (devArgs.compress) {
                console.log(`Packed ${archivePath}`);
              }
              if (shouldReload) {
                const deeplink = `sjmcl://reload-extension?id=${manifest.identifier}`;
                console.log(`Reload:      open ${deeplink}`);
              }
              isFirstBuild = false;
            } else {
              console.log(`${GREEN}✓${RESET} Built in ${DIM}${elapsed}ms${RESET}`);
            }

            if (shouldReload) {
              const deeplink = `sjmcl://reload-extension?id=${manifest.identifier}`;
              openUrl(deeplink);
            }
          });
        },
      },
    ],
  });

  await ctx.watch();
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Dev server failed: ${message}`);
  process.exitCode = 1;
});
