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
import * as clack from "@clack/prompts";
import { TextPrompt } from "@clack/core";
import os from "node:os";
import path from "node:path";
import color from "picocolors";
import semver from "semver";
import { getCliVersion } from "./banner.js";
import { renderBuildScriptTemplate } from "./template-build/render-build-script.js";
import { getTemplateProjectPath } from "./template-files.js";

const IDENTIFIER_PATTERN = /^[a-z][a-z0-9_-]*(\.[a-z][a-z0-9_-]*)+$/;
const TEMPLATE_DIR_PATH = getTemplateProjectPath();

function normalizePathToPosix(value) {
  return value.replace(/\\/g, "/");
}

function createPromptAdapter() {
  function unwrapPromptResult(result) {
    if (!clack.isCancel(result)) {
      return result;
    }

    clack.cancel("Operation cancelled.");
    process.exit(0);
  }

  function formatPromptSymbol(state) {
    switch (state) {
      case "initial":
      case "active":
        return color.cyan("◆");
      case "cancel":
        return color.red("■");
      case "error":
        return color.yellow("▲");
      case "submit":
        return color.green("◇");
      default:
        return color.cyan("◆");
    }
  }

  async function optionalText(label, options = {}) {
    const {
      defaultValue = "",
      emptyValueLabel = "(Skipped)",
      validate,
    } = options;
    const suggestion = defaultValue;

    const result = await new TextPrompt({
      defaultValue: "",
      placeholder: suggestion || undefined,
      validate,
      render() {
        const title = `${color.gray("│")}\n${formatPromptSymbol(this.state)}  ${label}\n`;
        const placeholderText = suggestion
          ? color.inverse(suggestion[0]) + color.dim(suggestion.slice(1))
          : color.inverse(color.hidden("_"));
        const activeValue = this.value ? this.valueWithCursor : placeholderText;

        switch (this.state) {
          case "error":
            return `${title.trim()}\n${color.yellow("│")}  ${activeValue}\n${color.yellow("└")}  ${color.yellow(this.error)}\n`;
          case "submit":
            return `${title}${color.gray("│")}  ${color.dim(
              this.value || emptyValueLabel
            )}`;
          case "cancel":
            return `${title}${color.gray("│")}  ${color.strikethrough(
              color.dim(this.value ?? "")
            )}${this.value?.trim() ? `\n${color.gray("│")}` : ""}`;
          default:
            return `${title}${color.cyan("│")}  ${activeValue}\n${color.cyan("└")}\n`;
        }
      },
    }).prompt();

    return unwrapPromptResult(result);
  }

  return {
    async text(label, options = {}) {
      const { defaultValue = "", placeholder, validate, emptyValueLabel } = options;

      if (emptyValueLabel) {
        return optionalText(label, {
          defaultValue,
          emptyValueLabel,
          validate,
        });
      }

      const result = await clack.text({
        message: label,
        defaultValue,
        placeholder: placeholder || defaultValue || undefined,
        validate,
      });

      return unwrapPromptResult(result);
    },
    async confirm(label, options = {}) {
      const result = await clack.confirm({
        message: label,
        initialValue: options.initialValue ?? false,
      });

      return unwrapPromptResult(result);
    },
  };
}

function getDefaultAuthor() {
  return process.env.npm_config_init_author_name || os.userInfo().username;
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

function validateOptionalSemver(fieldName) {
  return (value) => {
    if (!value.trim()) {
      return "";
    }

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

const EMPTY_OPTIONAL_PLACEHOLDER = "(Skipped)";
const CLI_VERSION = getCliVersion();

function buildOptionalJsonField(fieldName, value) {
  if (!value) {
    return "";
  }

  return `,\n  "${fieldName}": ${JSON.stringify(value)}`;
}

async function resolveTargetDirectory(prompt, cwd, projectDirectoryArg) {
  let defaultDirectory = projectDirectoryArg || "my-sjmcl-extension";

  while (true) {
    const directoryInput =
      projectDirectoryArg && defaultDirectory === projectDirectoryArg
        ? projectDirectoryArg
        : await prompt.text("Project directory", {
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

    const shouldOverwrite = await prompt.confirm(
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

async function writeGeneratedTemplateFiles(targetDirectory) {
  writeFileSync(
    path.join(targetDirectory, "scripts", "build.mjs"),
    await renderBuildScriptTemplate()
  );
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

export async function scaffoldProject({
  projectDirectoryArg,
  cwd,
  prompt = createPromptAdapter(),
}) {
  const targetDirectory = await resolveTargetDirectory(prompt, cwd, projectDirectoryArg);

  const directoryBaseName = toDirectoryBaseName(targetDirectory);
  const identifierSegment = toIdentifierSegment(directoryBaseName);
  const packageName = sanitizePackageName(directoryBaseName);
  const defaultIdentifier = `org.example.${identifierSegment}`;
  const defaultName = `${toTitleCase(directoryBaseName)} Extension`;
  
  const identifier = await prompt.text("Extension identifier", {
    defaultValue: defaultIdentifier,
    validate: validateIdentifier,
  });
  const name = await prompt.text("Extension name", {
    defaultValue: defaultName,
    validate: validateRequiredText("Extension name"),
  });
  const description = await prompt.text("Extension description (Optional)", {
    defaultValue: "My first SJMCL extension.",
    emptyValueLabel: EMPTY_OPTIONAL_PLACEHOLDER,
  });
  const author = await prompt.text("Extension author (Optional)", {
    defaultValue: getDefaultAuthor(),
    emptyValueLabel: EMPTY_OPTIONAL_PLACEHOLDER,
  });
  const version = await prompt.text("Extension version (Optional)", {
    defaultValue: "0.1.0",
    emptyValueLabel: EMPTY_OPTIONAL_PLACEHOLDER,
    validate: validateOptionalSemver("Extension version"),
  });
  const minimalLauncherVersion = await prompt.text(
    "Minimal launcher version (Optional)",
    {
      defaultValue: "1.0.0-beta.6",
      emptyValueLabel: EMPTY_OPTIONAL_PLACEHOLDER,
      validate: validateOptionalSemver("Minimal launcher version"),
    }
  );
  const normalizedDescription = description.trim();
  const normalizedAuthor = author.trim();
  const normalizedVersion = version.trim();
  const normalizedMinimalLauncherVersion = minimalLauncherVersion.trim();
  const packageVersion = normalizedVersion || "0.1.0";
  const frontendEntry = normalizePathToPosix(
    await prompt.text("Frontend entry", {
      defaultValue: "frontend/index.js",
      validate: validateFrontendEntry,
    })
  );

  const answers = {
    identifier,
    name,
    description: normalizedDescription,
    author: normalizedAuthor,
    version: normalizedVersion,
    minimalLauncherVersion: normalizedMinimalLauncherVersion,
    packageVersion,
    frontendEntry,
  };

  mkdirSync(targetDirectory, { recursive: true });
  copyTemplateTree(TEMPLATE_DIR_PATH, targetDirectory, {
    IDENTIFIER: answers.identifier,
    IDENTIFIER_JSON: JSON.stringify(answers.identifier),
    PACKAGE_NAME: packageName,
    PACKAGE_NAME_JSON: JSON.stringify(packageName),
    PACKAGE_DESCRIPTION_JSON: JSON.stringify(
      `${answers.name} SJMCL extension project.`
    ),
    NAME: answers.name,
    NAME_JSON: JSON.stringify(answers.name),
    DESCRIPTION: answers.description,
    DESCRIPTION_JSON: JSON.stringify(answers.description),
    OPTIONAL_DESCRIPTION_FIELD: buildOptionalJsonField(
      "description",
      answers.description
    ),
    AUTHOR: answers.author,
    AUTHOR_JSON: JSON.stringify(answers.author),
    OPTIONAL_AUTHOR_FIELD: buildOptionalJsonField("author", answers.author),
    VERSION: answers.packageVersion,
    VERSION_JSON: JSON.stringify(answers.packageVersion),
    OPTIONAL_VERSION_FIELD: buildOptionalJsonField("version", answers.version),
    MINIMAL_LAUNCHER_VERSION: answers.minimalLauncherVersion,
    MINIMAL_LAUNCHER_VERSION_JSON: JSON.stringify(
      answers.minimalLauncherVersion
    ),
    OPTIONAL_MINIMAL_LAUNCHER_VERSION_FIELD: buildOptionalJsonField(
      "minimalLauncherVersion",
      answers.minimalLauncherVersion
    ),
    FRONTEND_ENTRY: answers.frontendEntry,
    FRONTEND_ENTRY_JSON: JSON.stringify(answers.frontendEntry),
    CLI_VERSION: CLI_VERSION,
    CLI_VERSION_JSON: JSON.stringify(CLI_VERSION),
  });
  await writeGeneratedTemplateFiles(targetDirectory);

  printNextSteps(targetDirectory, cwd);
}
