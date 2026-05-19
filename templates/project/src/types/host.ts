export type SetStateAction<T> = T | ((current: T) => T);
export type StateSetter<T> = (value: SetStateAction<T>) => void;
export type ExtensionComponent<TProps = any> = (
  props: TProps,
  ...args: any[]
) => unknown;

export enum ExtensionUISlotKey {
  InstanceWorldItemMenuOperations = "ui.instance.world.item_menu_operations",
  InstanceServerItemMenuOperations = "ui.instance.server.item_menu_operations",
  InstanceModItemMenuOperations = "ui.instance.mod.item_menu_operations",
  InstanceResourcePackItemMenuOperations = "ui.instance.resourcepack.item_menu_operations",
  InstanceServerResPackItemMenuOperations = "ui.instance.server_resourcepack.item_menu_operations",
  InstanceSchematicItemMenuOperations = "ui.instance.schematic.item_menu_operations",
  InstanceShaderPackItemMenuOperations = "ui.instance.shaderpack.item_menu_operations",
}

export type ExtensionSlotKey = ExtensionUISlotKey;

export interface ExtensionFrontend {
  entry: string;
}

export interface ExtensionInfo {
  identifier: string;
  name: string;
  description?: string | null;
  author?: string | null;
  version?: string | null;
  minimalLauncherVersion?: string | null;
  path: string;
  iconSrc: string;
  frontend?: ExtensionFrontend | null;
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
  playerList: Record<string, unknown>[];
  /**
   * Available instance list snapshot.
   *
   * See: {@link https://mc.sjtu.cn/sjmcl/en/dev/extension/api.html#host-data}
   */
  instanceList: Record<string, unknown>[];
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
  updateConfig: (path: string, value: any) => void;
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
   * Navigates back inside the launcher.
   *
   * @example
   * host.actions.navBack();
   */
  navBack: () => void;
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
  openSharedModal: (key: string, params?: any) => void;
  /**
   * Opens a custom modal registered by the current extension.
   *
   * @example
   * host.actions.openCustomModal("example-modal", { from: api.identifier });
   */
  openCustomModal: (key: string, params?: any) => void;
  /**
   * Updates the title shown in a home widget header.
   *
   * Pass only `title` when the current extension declares a single home
   * widget. Pass both `key` and `title` when multiple home widgets are
   * registered.
   *
   * @since 1.1.0
   *
   * @example
   * host.actions.setHomeWidgetTitle("New Title");
   * host.actions.setHomeWidgetTitle("New Title", "home-example");
   *
   * See: {@link https://mc.sjtu.cn/sjmcl/en/dev/extension/api.html#sethomewidgettitle}
   */
  setHomeWidgetTitle: (title: string, key?: string) => void;
  /**
   * Reads a UTF-8 text file from the extension `data/` directory.
   *
   * @example
   * const content = await host.actions.readFile("notes/todo.txt");
   *
   * See: {@link https://mc.sjtu.cn/sjmcl/en/dev/extension/api.html#readfile}
   */
  readFile: (
    path: string,
    mode?: "string" | "base64"
  ) => Promise<string>;
  /**
   * Writes text content into a file under the extension `data/` directory.
   *
   * @example
   * await host.actions.writeFile("notes/todo.txt", "remember to ship");
   *
   * See: {@link https://mc.sjtu.cn/sjmcl/en/dev/extension/api.html#writefile}
   */
  writeFile: (
    path: string,
    content: string,
    mode?: "string" | "base64"
  ) => Promise<void>;
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
  /**
   * Downloads and schedules an extension self-update.
   *
   * @example
   * await host.actions.updateSelf(
   *   "https://example.com/example-extension-1.2.3.sjmclx",
   *   "1.2.3"
   * );
   *
   * See: {@link https://mc.sjtu.cn/sjmcl/en/dev/extension/api.html#updateself}
   */
  updateSelf: (src: string, newVersion: string) => Promise<void>;
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
export interface ExtensionAbilityApi {
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
    Editable: ExtensionComponent;
    FormattedMCText: ExtensionComponent;
    MarkdownContainer: ExtensionComponent;
    MenuSelector: ExtensionComponent;
    OptionItem: ExtensionComponent;
    OptionItemGroup: ExtensionComponent;
    Section: ExtensionComponent;
    Segmented: ExtensionComponent;
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
  getHostContext: () => ExtensionAbilityApi;
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
interface ExtensionBaseDefinition<TProps = object> {
  Component: ExtensionComponent<TProps>;
}

export interface ExtensionHomeWidgetDefinition extends ExtensionBaseDefinition {
  key?: string;
  title: string;
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
export interface ExtensionSettingsPageDefinition extends ExtensionBaseDefinition {}

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
export interface ExtensionPageDefinition extends ExtensionBaseDefinition {
  routePath: string;
  isStandAlone?: boolean;
}

/**
 * Props injected into a custom modal component.
 */
export interface ExtensionModalComponentProps {
  params?: any;
  close: () => void;
}

/**
 * Extension-declared custom modal rendered by the host.
 *
 * Additional modal options are forwarded to the launcher modal wrapper.
 */
export interface ExtensionModalDefinition
  extends ExtensionBaseDefinition<ExtensionModalComponentProps> {
  key: string;
  title: string;
  params?: any;
  [option: string]: unknown;
}

interface ExtensionInstanceSlotContextBase {
  instanceId: string | undefined;
  summary: Record<string, unknown> | undefined;
}

export type ExtensionSlotContextMap = {
  [ExtensionUISlotKey.InstanceWorldItemMenuOperations]: ExtensionInstanceSlotContextBase & {
    save: Record<string, unknown>;
  };
  [ExtensionUISlotKey.InstanceServerItemMenuOperations]: ExtensionInstanceSlotContextBase & {
    server: Record<string, unknown>;
  };
  [ExtensionUISlotKey.InstanceModItemMenuOperations]: ExtensionInstanceSlotContextBase & {
    mod: Record<string, unknown>;
  };
  [ExtensionUISlotKey.InstanceSchematicItemMenuOperations]: ExtensionInstanceSlotContextBase & {
    schematic: Record<string, unknown>;
  };
  [ExtensionUISlotKey.InstanceShaderPackItemMenuOperations]: ExtensionInstanceSlotContextBase & {
    pack: Record<string, unknown>;
  };
} & {
  [K in
    | ExtensionUISlotKey.InstanceResourcePackItemMenuOperations
    | ExtensionUISlotKey.InstanceServerResPackItemMenuOperations]: ExtensionInstanceSlotContextBase & {
    pack: Record<string, unknown>;
  };
};

interface CommonIconButtonSlotItem {
  icon: string | any;
  label?: string;
  onClick?: (...args: any[]) => void;
  danger?: boolean;
}

export type ExtensionSlotItemMap = {
  [K in
    | ExtensionUISlotKey.InstanceWorldItemMenuOperations
    | ExtensionUISlotKey.InstanceServerItemMenuOperations
    | ExtensionUISlotKey.InstanceModItemMenuOperations
    | ExtensionUISlotKey.InstanceResourcePackItemMenuOperations
    | ExtensionUISlotKey.InstanceServerResPackItemMenuOperations
    | ExtensionUISlotKey.InstanceSchematicItemMenuOperations
    | ExtensionUISlotKey.InstanceShaderPackItemMenuOperations]: CommonIconButtonSlotItem;
};

export interface ExtensionSlotDefinition<K extends ExtensionSlotKey> {
  getItems: (context: ExtensionSlotContextMap[K]) => ExtensionSlotItemMap[K][];
}

export interface ExtensionContributionBase {
  identifier: string;
  resetKey: string;
  extension: ExtensionInfo;
}

export interface ExtensionSlotContribution<K extends ExtensionSlotKey>
  extends ExtensionSlotDefinition<K>, ExtensionContributionBase {
  key: K;
}

export type ExtensionSlotRegistry = Partial<{
  [K in ExtensionSlotKey]: ExtensionSlotDefinition<K>;
}>;

export type ExtensionSlotContributionRegistry = Partial<{
  [K in ExtensionSlotKey]: ExtensionSlotContribution<K>;
}>;

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
export interface ExtensionContributionRegistration {
  homeWidget?: ExtensionHomeWidgetDefinition;
  homeWidgets?: ExtensionHomeWidgetDefinition[];
  settingsPage?: ExtensionSettingsPageDefinition;
  page?: ExtensionPageDefinition;
  pages?: ExtensionPageDefinition[];
  customModal?: ExtensionModalDefinition;
  customModals?: ExtensionModalDefinition[];
}

export interface ExtensionHomeWidgetContribution
  extends ExtensionHomeWidgetDefinition, ExtensionContributionBase {}

export interface ExtensionSettingsPageContribution
  extends ExtensionSettingsPageDefinition, ExtensionContributionBase {}

export interface ExtensionPageContribution
  extends ExtensionPageDefinition, ExtensionContributionBase {}

export interface ExtensionModalContribution
  extends ExtensionModalDefinition, ExtensionContributionBase {}

export interface ExtensionRegistration extends ExtensionContributionRegistration {
  slots?: ExtensionSlotRegistry;
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

export type HomeWidgetStateTuple = [string, number, boolean];

declare global {
  interface Window {
    registerExtension?: (factory: ExtensionFactory, token: string) => void;
  }
}
