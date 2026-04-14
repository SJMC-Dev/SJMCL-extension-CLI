import { readFileSync } from "node:fs";
import { stdout } from "node:process";

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const START_COLOR = [113, 175, 255];
const END_COLOR = [251, 195, 217];
const WHITE = [255, 255, 255];
const TITLE = "Create-SJMCL-Extension Scaffold ";
const SEPARATOR = "-----------------------------------------";

function supportsColor(stream) {
  return (
    Boolean(stream?.isTTY) &&
    process.env.NO_COLOR === undefined &&
    process.env.TERM !== "dumb"
  );
}

function getVersion() {
  const packageJson = JSON.parse(
    readFileSync(new URL("../package.json", import.meta.url), "utf8")
  );
  return packageJson.version;
}

function colorize(text, [r, g, b]) {
  return `\x1b[38;2;${r};${g};${b}m${text}${RESET}`;
}

function mixChannel(a, b, weight) {
  return Math.round(a + (b - a) * weight);
}

function gradientText(text) {
  const width = Math.max(text.length - 1, 1);
  let rendered = "";

  for (let index = 0; index < text.length; index += 1) {
    const weight = index / width;
    const color = [
      mixChannel(START_COLOR[0], END_COLOR[0], weight),
      mixChannel(START_COLOR[1], END_COLOR[1], weight),
      mixChannel(START_COLOR[2], END_COLOR[2], weight),
    ];
    rendered += colorize(text[index], color);
  }

  return rendered;
}

function plainBanner() {
  const version = getVersion();
  return [
    SEPARATOR,
    "",
    `Create-SJMCL-Extension Scaffold ${version}`,
    "",
    SEPARATOR,
    "",
  ].join("\n");
}

function colorBanner() {
  const version = getVersion();
  const title = `${gradientText(TITLE)}${colorize(version, WHITE)}`;

  return [
    `${BOLD}${SEPARATOR}${RESET}`,
    "",
    `${BOLD}${title}${RESET}`,
    "",
    `${BOLD}${SEPARATOR}${RESET}`,
    "",
  ].join("\n");
}

export function printWelcomeBanner(stream = stdout) {
  stream.write(supportsColor(stream) ? colorBanner() : plainBanner());
}
