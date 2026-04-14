import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import semver from "semver";

const IDENTIFIER_PATTERN = /^[a-z][a-z0-9_-]*(\.[a-z][a-z0-9_-]*)+$/;
const TEMPLATE_DIR = new URL("../templates/project/", import.meta.url);
const TEMPLATE_DIR_PATH = fileURLToPath(TEMPLATE_DIR);
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const BLUE = "\x1b[38;2;113;175;255m";
const WHITE = "\x1b[38;2;255;255;255m";

function normalizePathToPosix(value) {
  return value.replace(/\\/g, "/");
}

function supportsColor(stream) {
  return (
    Boolean(stream?.isTTY) &&
    process.env.NO_COLOR === undefined &&
    process.env.TERM !== "dumb"
  );
}

function stylePrompt(text, color) {
  return `${BOLD}${color}${text}${RESET}`;
}

function toPromptLine(label, defaultValue, stream) {
  if (!supportsColor(stream)) {
    if (!defaultValue) {
      return `* ${label}: `;
    }

    return `* ${label} (${defaultValue}): `;
  }

  const styledLabel = stylePrompt(`* ${label}`, BLUE);
  if (!defaultValue) {
    return `${styledLabel}: `;
  }

  return `${styledLabel} (${stylePrompt(defaultValue, WHITE)}): `;
}

async function promptInput(rl, label, options = {}) {
  const { defaultValue = "", validate } = options;

  while (true) {
    const answer = await rl.question(
      toPromptLine(label, defaultValue, rl.output)
    );
    const value = answer.trim() || defaultValue;

    if (validate) {
      const validationError = validate(value);
      if (validationError) {
        console.error(validationError);
        continue;
      }
    }

    return value;
  }
}

async function promptConfirm(rl, label) {
  while (true) {
    const answer = await rl.question(`${label} (y/n): `);
    const value = answer.trim().toLowerCase();

    if (value === "y" || value === "yes") {
      return true;
    }

    if (value === "n" || value === "no") {
      return false;
    }

    console.error("Please answer y or n.");
  }
}

function toDirectoryBaseName(targetDirectory) {
  const resolved = path.resolve(targetDirectory);
  return path.basename(resolved) || "sjmcl-extension";
}

function sanitizePackageName(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/^[._]+/, "")
    .replace(/[^a-z0-9~.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "sjmcl-extension";
}

function toIdentifierSegment(value) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/-+/g, "-")
    .replace(/^[_-]+|[_-]+$/g, "");
  const safe = normalized || "hello";

  if (/^[a-z]/.test(safe)) {
    return safe;
  }

  return `ext_${safe}`;
}

function toTitleCase(value) {
  const words = value
    .replace(/[_-]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return "Hello Extension";
  }

  return words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function validateProjectDirectory(value) {
  if (!value.trim()) {
    return "Project directory is required.";
  }

  return "";
}

function validateIdentifier(value) {
  if (!IDENTIFIER_PATTERN.test(value)) {
    return "Identifier must match the SJMCL pattern: org.example.hello";
  }

  return "";
}

function validateRequiredText(fieldName) {
  return (value) => {
    if (!value.trim()) {
      return `${fieldName} is required.`;
    }

    return "";
  };
}

function validateSemver(fieldName) {
  return (value) => {
    if (!semver.valid(value)) {
      return `${fieldName} must be a valid semantic version.`;
    }

    return "";
  };
}

function validateFrontendEntry(value) {
  const normalized = normalizePathToPosix(value.trim());

  if (!normalized) {
    return "Frontend entry is required.";
  }

  if (normalized.startsWith("/") || normalized.startsWith("../")) {
    return "Frontend entry must be a relative path inside the extension package.";
  }

  if (normalized.split("/").some((segment) => segment === ".." || !segment)) {
    return "Frontend entry must be a normalized relative path such as frontend/index.js.";
  }

  if (!normalized.endsWith(".js")) {
    return "Frontend entry must point to a .js file.";
  }

  return "";
}

async function resolveTargetDirectory(rl, cwd, projectDirectoryArg) {
  let defaultDirectory = projectDirectoryArg || "my-sjmcl-extension";

  while (true) {
    const directoryInput =
      projectDirectoryArg && defaultDirectory === projectDirectoryArg
        ? projectDirectoryArg
        : await promptInput(rl, "Project directory", {
            defaultValue: defaultDirectory,
            validate: validateProjectDirectory,
          });
    const targetDirectory = path.resolve(cwd, directoryInput);

    if (!existsSync(targetDirectory)) {
      return targetDirectory;
    }

    const stats = statSync(targetDirectory);
    if (stats.isDirectory() && readdirSync(targetDirectory).length === 0) {
      return targetDirectory;
    }

    const shouldOverwrite = await promptConfirm(
      rl,
      `Target ${path.resolve(targetDirectory)} already exists. Overwrite`
    );

    if (shouldOverwrite) {
      rmSync(targetDirectory, { recursive: true, force: true });
      return targetDirectory;
    }

    projectDirectoryArg = "";
    defaultDirectory = directoryInput;
  }
}

function renderTemplate(filePath, replacements) {
  let content = readFileSync(filePath, "utf8");

  for (const [key, value] of Object.entries(replacements)) {
    content = content.replaceAll(`__${key}__`, value);
  }

  return content;
}

function copyTemplateTree(templateDirectory, targetDirectory, replacements) {
  for (const entry of readdirSync(templateDirectory, { withFileTypes: true })) {
    const sourcePath = path.join(templateDirectory, entry.name);
    const outputName =
      entry.name === "gitignore.tmpl"
        ? ".gitignore"
        : entry.name.endsWith(".tmpl")
          ? entry.name.slice(0, -".tmpl".length)
          : entry.name;
    const targetPath = path.join(targetDirectory, outputName);

    if (entry.isDirectory()) {
      mkdirSync(targetPath, { recursive: true });
      copyTemplateTree(sourcePath, targetPath, replacements);
      continue;
    }

    if (entry.name.endsWith(".tmpl")) {
      writeFileSync(targetPath, renderTemplate(sourcePath, replacements));
    } else {
      cpSync(sourcePath, targetPath);
    }
  }
}

function writeJson(filePath, value) {
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function getDefaultAuthor() {
  return process.env.npm_config_init_author_name || os.userInfo().username;
}

function buildPackageJson(packageName, version, extensionName) {
  return {
    name: packageName,
    private: true,
    version,
    description: `${extensionName} SJMCL extension project.`,
    type: "module",
    scripts: {
      build: "node ./scripts/build.mjs",
      bump: "node ./scripts/bump.mjs",
    },
    devDependencies: {
      esbuild: "^0.25.3",
      fflate: "^0.8.2",
      semver: "^7.7.2",
    },
  };
}

function buildManifest(answers) {
  return {
    identifier: answers.identifier,
    name: answers.name,
    description: answers.description,
    author: answers.author,
    version: answers.version,
    minimalLauncherVersion: answers.minimalLauncherVersion,
    frontend: {
      entry: answers.frontendEntry,
    },
  };
}

function printNextSteps(targetDirectory, cwd) {
  const relativeTarget = path.relative(cwd, targetDirectory);
  const displayDirectory =
    !relativeTarget || relativeTarget === ""
      ? "."
      : relativeTarget.startsWith("..")
        ? path.resolve(targetDirectory)
        : relativeTarget;

  console.log("");
  console.log(`Created ${path.resolve(targetDirectory)}`);
  console.log("");
  console.log("Next steps:");
  if (displayDirectory !== ".") {
    console.log(`  cd ${displayDirectory}`);
  }
  console.log("  npm install");
  console.log("  npm run build");
  console.log("  npm run bump -- 0.1.1");
}

export async function scaffoldProject({ projectDirectoryArg, cwd, rl }) {
  const targetDirectory = await resolveTargetDirectory(
    rl,
    cwd,
    projectDirectoryArg
  );

  const directoryBaseName = toDirectoryBaseName(targetDirectory);
  const identifierSegment = toIdentifierSegment(directoryBaseName);
  const packageName = sanitizePackageName(directoryBaseName);
  const defaultIdentifier = `org.example.${identifierSegment}`;
  const defaultName = `${toTitleCase(directoryBaseName)} Extension`;
  
  const identifier = await promptInput(rl, "Extension identifier", {
    defaultValue: defaultIdentifier,
    validate: validateIdentifier,
  });
  const name = await promptInput(rl, "Extension name", {
    defaultValue: defaultName,
    validate: validateRequiredText("Extension name"),
  });
  const description = await promptInput(rl, "Extension description", {
    defaultValue: "My first SJMCL extension.",
    validate: validateRequiredText("Extension description"),
  });
  const author = await promptInput(rl, "Extension author", {
    defaultValue: getDefaultAuthor(),
    validate: validateRequiredText("Extension author"),
  });
  const version = await promptInput(rl, "Extension version", {
    defaultValue: "0.1.0",
    validate: validateSemver("Extension version"),
  });
  const minimalLauncherVersion = await promptInput(
    rl,
    "Minimal launcher version",
    {
      defaultValue: "1.0.0-beta.4",
      validate: validateSemver("Minimal launcher version"),
    }
  );
  const frontendEntry = normalizePathToPosix(
    await promptInput(rl, "Frontend entry", {
      defaultValue: "frontend/index.js",
      validate: validateFrontendEntry,
    })
  );

  const answers = {
    identifier,
    name,
    description,
    author,
    version,
    minimalLauncherVersion,
    frontendEntry,
  };

  mkdirSync(targetDirectory, { recursive: true });
  copyTemplateTree(TEMPLATE_DIR_PATH, targetDirectory, {
    IDENTIFIER: answers.identifier,
    NAME: answers.name,
    NAME_JSON: JSON.stringify(answers.name),
    DESCRIPTION: answers.description,
    DESCRIPTION_JSON: JSON.stringify(answers.description),
    AUTHOR: answers.author,
    VERSION: answers.version,
    MINIMAL_LAUNCHER_VERSION: answers.minimalLauncherVersion,
    FRONTEND_ENTRY: answers.frontendEntry,
  });

  writeJson(
    path.join(targetDirectory, "package.json"),
    buildPackageJson(packageName, answers.version, answers.name)
  );
  writeJson(path.join(targetDirectory, "sjmcl.ext.json"), buildManifest(answers));

  printNextSteps(targetDirectory, cwd);
}
