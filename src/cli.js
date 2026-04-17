import { Command } from "commander";
import { stdout as output } from "node:process";
import { getCliVersion, printWelcomeBannerWithUpdate } from "./banner.js";
import { scaffoldProject } from "./scaffold.js";
import { checkForUpdates } from "./update-check.js";

function createCliProgram() {
  return new Command()
    .name("create-sjmcl-extension")
    .usage("[project-directory]")
    .description("Scaffold an SJMCL extension project.")
    .argument("[project-directory]", "Target project directory")
    .helpOption("-h, --help", "Show this help message")
    .showHelpAfterError()
    .showSuggestionAfterError();
}

export async function runCli(argv) {
  const program = createCliProgram();
  await program.parseAsync(argv, { from: "user" });

  const latestVersion = await checkForUpdates(getCliVersion());
  printWelcomeBannerWithUpdate(output, latestVersion);

  const [projectDirectoryArg] = program.processedArgs;
  await scaffoldProject({
    projectDirectoryArg,
    cwd: process.cwd(),
  });
}
