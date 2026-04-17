export type SetStateAction<T> = T | ((current: T) => T);
export type StateSetter<T> = (value: SetStateAction<T>) => void;
export type ExtensionComponent = (...args: any[]) => unknown;

export interface ExtensionInfo {
  identifier: string;
  name: string;
  description?: string | null;
  author?: string | null;
  version?: string | null;
  minimalLauncherVersion?: string | null;
  path: string;
  iconSrc: string;
  frontend?: {
    entry: string;
  } | null;
}

/**
 * Snapshot returned by `api.useHostData()`.
 *
 * The launcher owns this data and updates it when players, instances, config,
 * or route parameters change.
 *
 * @example
 * const hostData = api.useHostData();
 * const playerName = hostData.selectedPlayer?.name ?? "None";
 *
 * See: {@link https://mc.sjtu.cn/sjmcl/en/dev/extension/api.html#host-data}
 */
export interface ExtensionAbilityData {
  /**
   * Launcher configuration snapshot.
   *
   * See: {@link https://mc.sjtu.cn/sjmcl/en/dev/extension/api.html#host-data}
   */
  config: Record<string, unknown>;
  /**
   * Currently selected player, if any.
   *
   * See: {@link https://mc.sjtu.cn/sjmcl/en/dev/extension/api.html#host-data}
   */
  selectedPlayer: { name?: string } | undefined;
  /**
   * Currently selected instance, if any.
   *
   * See: {@link https://mc.sjtu.cn/sjmcl/en/dev/extension/api.html#host-data}
   */
  selectedInstance: { name?: string } | undefined;
  /**
   * Available player list snapshot.
   *
   * See: {@link https://mc.sjtu.cn/sjmcl/en/dev/extension/api.html#host-data}
   */
  playerList: Array<Record<string, unknown>>;
  /**
   * Available instance list snapshot.
   *
   * See: {@link https://mc.sjtu.cn/sjmcl/en/dev/extension/api.html#host-data}
   */
  instanceList: Array<Record<string, unknown>>;
  /**
   * Current route query parameters.
   *
   * See: {@link https://mc.sjtu.cn/sjmcl/en/dev/extension/api.html#host-data}
   */
  routeQuery: Record<string, string | string[] | undefined>;
}

/**
 * Host-implemented abilities exposed through `host.actions`.
 *
 * These actions cover config updates, navigation, file access, network
 * requests, host integration, and extension reload.
 *
 * @example
 * const host = api.getHostContext();
 * const { actions } = host;
 *
 * See: {@link https://mc.sjtu.cn/sjmcl/en/dev/extension/api.html#host-actions}
 */
export interface ExtensionAbilityActions {
  /**
   * Gets the player list.
   *
   * @example
   * const players = host.actions.getPlayerList();
   *
   * See: {@link https://mc.sjtu.cn/sjmcl/en/dev/extension/api.html#getplayerlist}
   */
  getPlayerList: (sync?: boolean) => ExtensionAbilityData["playerList"] | undefined;
  /**
   * Gets the instance list.
   *
   * @example
   * const instances = host.actions.getInstanceList();
   *
   * See: {@link https://mc.sjtu.cn/sjmcl/en/dev/extension/api.html#getinstancelist}
   */
  getInstanceList: (sync?: boolean) => ExtensionAbilityData["instanceList"] | undefined;
  /**
   * Updates the value at a config path.
   *
   * @example
   * host.actions.updateConfig("path.to.value", true);
   *
   * See: {@link https://mc.sjtu.cn/sjmcl/en/dev/extension/api.html#updateconfig}
   */
  updateConfig: (path: string, value: unknown) => void;
  /**
   * Navigates within the route scope allowed for the extension.
   *
   * @example
   * await host.actions.navigate(`/extension/${api.identifier}/example`);
   *
   * See: {@link https://mc.sjtu.cn/sjmcl/en/dev/extension/api.html#navigate}
   */
  navigate: (route: string) => Promise<void>;
  /**
   * Opens a standalone window for the given route.
   *
   * @example
   * host.actions.openWindow(
   *   `/standalone/extension/${api.identifier}/example-standalone`,
   *   "Example Standalone Page"
   * );
   *
   * See: {@link https://mc.sjtu.cn/sjmcl/en/dev/extension/api.html#openwindow}
   */
  openWindow: (route: string, title: string) => void;
  /**
   * Requests the host to open an external link.
   *
   * @example
   * await host.actions.openExternalLink("https://mc.sjtu.cn/sjmcl/");
   *
   * See: {@link https://mc.sjtu.cn/sjmcl/en/dev/extension/api.html#openexternallink}
   */
  openExternalLink: (url: string) => Promise<void>;
  /**
   * Opens a shared host modal.
   *
   * @example
   * host.actions.openSharedModal("example-modal", { from: api.identifier });
   *
   * See: {@link https://mc.sjtu.cn/sjmcl/en/dev/extension/api.html#opensharedmodal}
   */
  openSharedModal: (key: string, params?: unknown) => void;
  /**
   * Reads a UTF-8 text file from the extension `data/` directory.
   *
   * @example
   * const content = await host.actions.readFile("notes/todo.txt");
   *
   * See: {@link https://mc.sjtu.cn/sjmcl/en/dev/extension/api.html#readfile}
   */
  readFile: (path: string) => Promise<string>;
  /**
   * Writes text content into a file under the extension `data/` directory.
   *
   * @example
   * await host.actions.writeFile("notes/todo.txt", "remember to ship");
   *
   * See: {@link https://mc.sjtu.cn/sjmcl/en/dev/extension/api.html#writefile}
   */
  writeFile: (path: string, content: string) => Promise<void>;
  /**
   * Deletes a file under the extension `data/` directory.
   *
   * @example
   * await host.actions.deleteFile("notes/todo.txt");
   *
   * See: {@link https://mc.sjtu.cn/sjmcl/en/dev/extension/api.html#deletefile}
   */
  deleteFile: (path: string) => Promise<void>;
  /**
   * Deletes a directory under the extension `data/` directory.
   *
   * @example
   * await host.actions.deleteDirectory("notes");
   *
   * See: {@link https://mc.sjtu.cn/sjmcl/en/dev/extension/api.html#deletedirectory}
   */
  deleteDirectory: (path: string) => Promise<void>;
  /**
   * Performs an HTTP request and returns a response object.
   *
   * @example
   * const response = await host.actions.request("https://example.com/api");
   *
   * See: {@link https://mc.sjtu.cn/sjmcl/en/dev/extension/api.html#request}
   */
  request: (input: URL | Request | string, init?: RequestInit) => Promise<Response>;
  /**
   * Requests text content and decodes it with the given encoding.
   *
   * @example
   * const text = await host.actions.requestText("https://example.com/robots.txt");
   *
   * See: {@link https://mc.sjtu.cn/sjmcl/en/dev/extension/api.html#request}text
   */
  requestText: (
    url: string,
    init?: RequestInit,
    encoding?: string
  ) => Promise<string>;
  /**
   * Calls a host command and returns its result.
   *
   * @example
   * const result = await host.actions.invoke("example-command", { value: 1 });
   *
   * See: {@link https://mc.sjtu.cn/sjmcl/en/dev/extension/api.html#invoke}
   */
  invoke: <T = unknown>(
    command: string,
    payload?: Record<string, unknown>
  ) => Promise<T>;
  /**
   * Accesses the host logger.
   *
   * @example
   * host.actions.logger.info("extension log");
   *
   * See: {@link https://mc.sjtu.cn/sjmcl/en/dev/extension/api.html#logger}
   */
  logger: Record<string, (...args: any[]) => void>;
  /**
   * Reloads the extension.
   *
   * @example
   * host.actions.reloadSelf();
   *
   * See: {@link https://mc.sjtu.cn/sjmcl/en/dev/extension/api.html#reloadself}
   */
  reloadSelf: () => void;
}

/**
 * Host-backed state helpers exposed through `host.state`.
 *
 * See: {@link https://mc.sjtu.cn/sjmcl/en/dev/extension/api.html#host-state}
 */
export interface ExtensionAbilityState {
  /**
   * Extension-scoped state hook, similar to React `useState`.
   *
   * The launcher stores this state under the current extension scope.
   *
   * @example
   * const [count, setCount] = host.state.useExtensionState("count", 0);
   *
   * See: {@link https://mc.sjtu.cn/sjmcl/en/dev/extension/api.html#host-state}-useextensionstate-key-initialvalue
   */
  useExtensionState: <T>(key: string, initialValue: T) => [T, StateSetter<T>];
}

/**
 * Host context returned by `api.getHostContext()`.
 *
 * @example
 * const host = api.getHostContext();
 * const { actions, state } = host;
 *
 * See: {@link https://mc.sjtu.cn/sjmcl/en/dev/extension/api.html#api-gethostcontext}
 */
export interface ExtensionHostContext {
  /**
   * Host action methods implemented by the launcher.
   *
   * See: {@link https://mc.sjtu.cn/sjmcl/en/dev/extension/api.html#host-actions}
   */
  actions: ExtensionAbilityActions;
  /**
   * Host-backed extension state helpers.
   *
   * See: {@link https://mc.sjtu.cn/sjmcl/en/dev/extension/api.html#host-state}
   */
  state: ExtensionAbilityState;
}

/**
 * Objects injected into the extension factory by the launcher host.
 *
 * @example
 * (function registerExtension(factory) {
 *   const token = document.currentScript?.dataset?.extensionToken || "";
 *   window.registerExtension?.(factory, token);
 * })(function createExtension(api) {
 *   return {};
 * });
 *
 * See: {@link https://mc.sjtu.cn/sjmcl/en/dev/extension/api.html}
 */
export interface ExtensionFactoryApi {
  /**
   * The host React runtime.
   *
   * @example
   * const React = api.React;
   *
   * See: {@link https://mc.sjtu.cn/sjmcl/en/dev/extension/api.html}#api-react
   */
  React: Record<string, any>;
  /**
   * The host Chakra UI bundle.
   *
   * @example
   * const { Box, Text, Button } = api.ChakraUI;
   *
   * See: {@link https://mc.sjtu.cn/sjmcl/en/dev/extension/api.html}#api-chakraui
   */
  ChakraUI: Record<string, any>;
  /**
   * Host business components.
   *
   * @example
   * const { Section, WrapCard } = api.Components;
   *
   * See: {@link https://mc.sjtu.cn/sjmcl/en/dev/extension/api.html}#api-components
   */
  Components: {
    OptionItem: ExtensionComponent;
    OptionItemGroup: ExtensionComponent;
    Section: ExtensionComponent;
    WrapCard: ExtensionComponent;
    WrapCardGroup: ExtensionComponent;
  };
  /**
   * Extension identifier.
   *
   * @example
   * const id = api.identifier;
   *
   * See: {@link https://mc.sjtu.cn/sjmcl/en/dev/extension/api.html}#api-identifier
   */
  identifier: string;
  /**
   * Resolves an extension-relative path to an asset URL.
   *
   * The path is relative to the extension root, for example
   * `"assets/video.mp4"`.
   *
   * @example
   * const iconUrl = api.resolveAssetUrl("assets/icon.png");
   *
   * See: {@link https://mc.sjtu.cn/sjmcl/en/dev/extension/api.html}#api-resolveasseturl-path
   */
  resolveAssetUrl: (path: string) => string;
  /**
   * Returns the host context object.
   *
   * @example
   * const host = api.getHostContext();
   *
   * See: {@link https://mc.sjtu.cn/sjmcl/en/dev/extension/api.html#api-gethostcontext}
   */
  getHostContext: () => ExtensionHostContext;
  /**
   * React Hook for reading host data snapshots.
   *
   * Components receive updated snapshots when host-owned data changes.
   *
   * @example
   * const hostData = api.useHostData();
   *
   * See: {@link https://mc.sjtu.cn/sjmcl/en/dev/extension/api.html}#api-usehostdata
   */
  useHostData: () => ExtensionAbilityData;
}

/**
 * Single home card contribution.
 *
 * @example
 * const homeWidget = {
 *   title: "Hello",
 *   Component: createHomeWidget(api),
 * };
 *
 * See: {@link https://mc.sjtu.cn/sjmcl/en/dev/extension/api.html}#homewidget
 */
export interface ExtensionHomeWidgetDefinition {
  key?: string;
  title: string;
  Component: ExtensionComponent;
  description?: string;
  icon?: string;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
}

/**
 * Extension settings page contribution.
 *
 * Route: `/settings/extension/<identifier>`.
 *
 * @example
 * const settingsPage = {
 *   Component: createSettingsPage(api),
 * };
 *
 * See: {@link https://mc.sjtu.cn/sjmcl/en/dev/extension/api.html}#settingspage
 */
export interface ExtensionSettingsPageDefinition {
  Component: ExtensionComponent;
}

/**
 * Single extension page contribution.
 *
 * General route: `/extension/<identifier>/<routePath>`.
 * Standalone route: `/standalone/extension/<identifier>/<routePath>`.
 *
 * @example
 * const page = {
 *   routePath: "example",
 *   Component: createExamplePage(api, false),
 * };
 *
 * See: {@link https://mc.sjtu.cn/sjmcl/en/dev/extension/api.html}#page
 */
export interface ExtensionPageDefinition {
  routePath: string;
  Component: ExtensionComponent;
  isStandAlone?: boolean;
}

/**
 * Object returned by `factory(api)` to register extension UI contributions.
 *
 * @example
 * return {
 *   homeWidget: {
 *     title: "Hello",
 *     Component: createHomeWidget(api),
 *   },
 *   settingsPage: {
 *     Component: createSettingsPage(api),
 *   },
 *   pages: [
 *     {
 *       routePath: "example",
 *       Component: createExamplePage(api, false),
 *     },
 *   ],
 * };
 *
 * See: {@link https://mc.sjtu.cn/sjmcl/en/dev/extension/api.html}#ui-contributions
 */
export interface ExtensionRegistration {
  homeWidget?: ExtensionHomeWidgetDefinition;
  homeWidgets?: ExtensionHomeWidgetDefinition[];
  settingsPage?: ExtensionSettingsPageDefinition;
  page?: ExtensionPageDefinition;
  pages?: ExtensionPageDefinition[];
  dispose?: () => void;
}

/**
 * Extension entry factory registered through `window.registerExtension`.
 *
 * @example
 * (function register(factory) {
 *   const token = document.currentScript?.dataset?.extensionToken || "";
 *   window.registerExtension?.(factory, token);
 * })(function createExtension(api) {
 *   return {};
 * });
 *
 * See: {@link https://mc.sjtu.cn/sjmcl/en/dev/extension/api.html}#registration-entry
 */
export type ExtensionFactory = (
  api: ExtensionFactoryApi
) => ExtensionRegistration | void;

declare global {
  interface Window {
    registerExtension?: (factory: ExtensionFactory, token: string) => void;
  }
}
