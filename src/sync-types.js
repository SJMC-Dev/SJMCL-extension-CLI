import { existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { readTemplateProjectFile } from "./template-files.js";

function resolveProjectRoot(cwd, projectDirectoryArg) {
  const projectRoot = path.resolve(cwd, projectDirectoryArg || ".");

  if (!existsSync(projectRoot)) {
    throw new Error(`Project directory does not exist: ${projectRoot}`);
  }

  if (!statSync(projectRoot).isDirectory()) {
    throw new Error(`Project path is not a directory: ${projectRoot}`);
  }

  return projectRoot;
}

export async function syncProjectTypes({ projectDirectoryArg, cwd }) {
  const projectRoot = resolveProjectRoot(cwd, projectDirectoryArg);
  const targetPath = path.join(projectRoot, "src", "types", "host.ts");
  const latestTypes = readTemplateProjectFile("src", "types", "host.ts");

  mkdirSync(path.dirname(targetPath), { recursive: true });
  writeFileSync(targetPath, latestTypes);

  console.log("");
  console.log(`Updated ${targetPath}`);
  console.log("Regenerated only src/types/host.ts from the latest scaffold template.");
}
