import type { ExtensionFactoryApi } from "../types/host";

const SETTINGS_FILE = "settings.json";
const SETTINGS_STATE_KEY = "buttonSettings";
const SETTINGS_READY_STATE_KEY = "buttonSettingsReady";
let initPromise: Promise<Record<string, boolean>> | null = null;

export const DEFAULT_BUTTON_SETTINGS: Record<string, boolean> = {
  customPageEnabled: true,
  standalonePageEnabled: true,
  documentEnabled: true,
};

function normalizeButtonSettings(parsed: unknown): Record<string, boolean> {
  const value =
    parsed && typeof parsed === "object"
      ? (parsed as Record<string, unknown>)
      : {};

  return {
    customPageEnabled: value.customPageEnabled !== false,
    standalonePageEnabled: value.standalonePageEnabled !== false,
    documentEnabled: value.documentEnabled !== false,
  };
}

async function writeButtonSettingsFile(
  host: ReturnType<ExtensionFactoryApi["getHostContext"]>,
  nextSettings: Record<string, boolean>
) {
  await host.actions.writeFile(
    SETTINGS_FILE,
    `${JSON.stringify(normalizeButtonSettings(nextSettings), null, 2)}\n`
  );
}

async function readButtonSettingsFile(
  host: ReturnType<ExtensionFactoryApi["getHostContext"]>
): Promise<Record<string, boolean>> {
  try {
    const raw = await host.actions.readFile(SETTINGS_FILE);
    const nextSettings = normalizeButtonSettings(JSON.parse(raw));
    const normalizedRaw = `${JSON.stringify(nextSettings, null, 2)}\n`;
    if (raw !== normalizedRaw) {
      await writeButtonSettingsFile(host, nextSettings);
    }
    return nextSettings;
  } catch (_) {
    await writeButtonSettingsFile(host, DEFAULT_BUTTON_SETTINGS);
    return DEFAULT_BUTTON_SETTINGS;
  }
}

export function useButtonSettings(api: ExtensionFactoryApi) {
  const React = api.React;
  const host = api.getHostContext();
  const [settings, setSettings] = host.state.useExtensionState(
    SETTINGS_STATE_KEY,
    DEFAULT_BUTTON_SETTINGS
  );
  const [hasLoaded, setHasLoaded] = host.state.useExtensionState(
    SETTINGS_READY_STATE_KEY,
    false
  );

  React.useEffect(
    function ensureSettingsLoaded() {
      if (hasLoaded) {
        return;
      }

      let cancelled = false;

      if (!initPromise) {
        initPromise = readButtonSettingsFile(api.getHostContext());
      }

      void initPromise.then(function applyLoadedSettings(nextSettings) {
        if (!cancelled) {
          setSettings(nextSettings);
          setHasLoaded(true);
        }
      });

      return function cleanup() {
        cancelled = true;
      };
    },
    [api, hasLoaded, setHasLoaded, setSettings]
  );

  const writeSettings = React.useCallback(
    async function writeSettings(nextSettings: Record<string, boolean>) {
      const normalized = normalizeButtonSettings(nextSettings);
      setSettings(normalized);
      setHasLoaded(true);
      await writeButtonSettingsFile(api.getHostContext(), normalized);
      return normalized;
    },
    [api, setHasLoaded, setSettings]
  );

  return {
    settings,
    hasLoaded,
    writeSettings,
  };
}
