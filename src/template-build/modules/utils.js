import { BOLD, RESET, YELLOW } from "./constants.js";

export function supportsColor(stream) {
  return (
    Boolean(stream?.isTTY) &&
    process.env.NO_COLOR === undefined &&
    process.env.TERM !== "dumb"
  );
}

export function formatWarningLabel() {
  if (!supportsColor(process.stderr)) {
    return "WARNING";
  }

  return `${BOLD}${YELLOW}WARNING${RESET}`;
}

export function normalizeRelativePath(value) {
  return String(value || "")
    .replace(/\\/g, "/")
    .trim();
}

export function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function isNodeModulesPath(filePath) {
  return /(^|\/)node_modules\//.test(normalizeRelativePath(filePath));
}

export function validateRelativePackagePath(value, fieldName) {
  const normalized = normalizeRelativePath(value);

  if (!normalized) {
    throw new Error(`${fieldName} is required.`);
  }

  if (normalized.startsWith("/") || normalized.startsWith("../")) {
    throw new Error(`${fieldName} must stay inside the extension package.`);
  }

  if (normalized.split("/").some((segment) => segment === "" || segment === "..")) {
    throw new Error(`${fieldName} must be a normalized relative path.`);
  }

  if (!normalized.endsWith(".js")) {
    throw new Error(`${fieldName} must point to a .js file.`);
  }

  return normalized;
}
