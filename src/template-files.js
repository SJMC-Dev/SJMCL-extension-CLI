import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TEMPLATE_PROJECT_DIR = fileURLToPath(
  new URL("../templates/project/", import.meta.url)
);

export function getTemplateProjectPath(...segments) {
  return path.join(TEMPLATE_PROJECT_DIR, ...segments);
}

export function readTemplateProjectFile(...segments) {
  return readFileSync(getTemplateProjectPath(...segments), "utf8");
}
