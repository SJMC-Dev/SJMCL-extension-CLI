import { Command } from "commander";
import { stdout as output } from "node:process";
import { getCliVersion, printWelcomeBannerWithUpdate } from "./banner.js";
import { scaffoldProject } from "./scaffold.js";
import { syncProjectTypes } from "./sync-types.js";
import { checkForUpdates } from "./update-check.js";

function createCliProgram() {
  const program = new Command()
    .name("create-sjmcl-extension")
    .usage("[project-directory]")
    .description("Scaffold an SJMCL extension project and maintain template files.")
    .argument("[project-directory]", "Target directory for a new project")
    .helpOption("-h, --help", "Show this help message")
    .showHelpAfterError()
    .showSuggestionAfterError();

  program
    .command("sync-types [project-directory]")
    .description(
      "Regenerate only src/types/host.ts in an existing project from the latest scaffold template"
    )
    .action(async (projectDirectoryArg) => {
      await syncProjectTypes({
        projectDirectoryArg,
        cwd: process.cwd(),
      });
    });

  program.action(async (projectDirectoryArg) => {
    await scaffoldProject({
      projectDirectoryArg,
      cwd: process.cwd(),
    });
  });

  return program;
}

export async function runCli(argv) {
  const program = createCliProgram();
  const latestVersion = await checkForUpdates(getCliVersion());
  let didPrintBanner = false;
  program.hook("preAction", () => {
    if (didPrintBanner) {
      return;
    }

    printWelcomeBannerWithUpdate(output, latestVersion);
    didPrintBanner = true;
  });
  await program.parseAsync(argv, { from: "user" });
}
