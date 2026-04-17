import { Command, Option } from "commander";

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

function parseObfuscateValue(rawValue) {
  if (rawValue === undefined) {
    return true;
  }

  return parseBooleanValue(rawValue, "--obfuscate");
}

function createBuildOptionsProgram() {
  return new Command()
    .name("build")
    .helpOption(false)
    .addOption(
      new Option("--mode <mode>", "Build mode").choices([
        "development",
        "production",
      ])
    )
    .addOption(
      new Option("--obfuscate [enabled]", "Enable identifier minification")
        .argParser(parseObfuscateValue)
        .default(undefined)
    )
    .allowUnknownOption(false)
    .allowExcessArguments(false)
    .exitOverride();
}

export function parseBuildArguments(argv) {
  const program = createBuildOptionsProgram();

  try {
    program.parse(argv, { from: "user" });
  } catch (error) {
    if (error?.code?.startsWith("commander.")) {
      throw new Error(error.message.trim());
    }

    throw error;
  }

  const options = program.opts();

  return {
    mode: options.mode,
    obfuscate: options.obfuscate,
  };
}

export function resolveBuildOptions(argv) {
  const buildArguments = parseBuildArguments(argv);
  const buildMode = buildArguments.mode || "production";

  return {
    buildMode,
    obfuscate: buildArguments.obfuscate ?? buildMode === "production",
  };
}
