import https from "node:https";
import semver from "semver";

const DEFAULT_REGISTRY = "https://registry.npmjs.org/";
const REQUEST_TIMEOUT_MS = 1500;

function normalizeRegistryUrl(value) {
  if (!value) {
    return DEFAULT_REGISTRY;
  }

  return value.endsWith("/") ? value : `${value}/`;
}

function readPackageName() {
  return "create-sjmcl-extension";
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(
      url,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "create-sjmcl-extension",
        },
      },
      (response) => {
        if (response.statusCode !== 200) {
          response.resume();
          reject(new Error(`Unexpected status: ${response.statusCode}`));
          return;
        }

        let body = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          body += chunk;
        });
        response.on("end", () => {
          try {
            resolve(JSON.parse(body));
          } catch (error) {
            reject(error);
          }
        });
      }
    );

    request.setTimeout(REQUEST_TIMEOUT_MS, () => {
      request.destroy(new Error("Request timed out"));
    });
    request.on("error", reject);
  });
}

export async function checkForUpdates(currentVersion) {
  try {
    const registry = normalizeRegistryUrl(process.env.npm_config_registry);
    const packageName = readPackageName();
    const url = new URL(packageName, registry);
    const metadata = await fetchJson(url);
    const latestVersion = metadata?.["dist-tags"]?.latest;

    if (!semver.valid(currentVersion) || !semver.valid(latestVersion)) {
      return null;
    }

    if (!semver.gt(latestVersion, currentVersion)) {
      return null;
    }

    return latestVersion;
  } catch {
    return null;
  }
}
