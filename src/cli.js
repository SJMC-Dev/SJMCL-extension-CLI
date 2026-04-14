import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { printWelcomeBanner } from "./banner.js";
import { scaffoldProject } from "./scaffold.js";

function showHelp() {
  console.log(`create-sjmcl-extension

Usage:
  npm create sjmcl-extension@latest [project-directory]
  npx create-sjmcl-extension [project-directory]

Options:
  --help, -h    Show this help message
`);
}

export async function runCli(argv) {
  if (argv.includes("--help") || argv.includes("-h")) {
    showHelp();
    return;
  }

  printWelcomeBanner(output);

  const projectDirectoryArg = argv.find((value) => !value.startsWith("-"));
  const rl = createInterface({ input, output });

  try {
    await scaffoldProject({
      projectDirectoryArg,
      cwd: process.cwd(),
      rl,
    });
  } finally {
    rl.close();
  }
}
