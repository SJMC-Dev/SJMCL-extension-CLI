export const IDENTIFIER_PATTERN = /^[a-z][a-z0-9_-]*(\.[a-z][a-z0-9_-]*)+$/;
export const RESET = "\x1b[0m";
export const BOLD = "\x1b[1m";
export const YELLOW = "\x1b[33m";
export const FORBIDDEN_IMPORT_TARGETS = new Map([
  ["react", "api.React"],
  ["@chakra-ui/react", "api.ChakraUI"],
]);
export const HOST_SINGLETON_PACKAGES = [
  { packageName: "react", replacement: "api.React" },
  { packageName: "@chakra-ui/react", replacement: "api.ChakraUI" },
];
export const HOST_PROVIDED_SINGLETON_DOCS =
  "https://mc.sjtu.cn/sjmcl/en/dev/extension/api.html#injected-objects";
export const JSX_PATTERN = /<\/?[A-Za-z][\w.:+-]*(?:\s[^<>]*?)?>|<>|<\/>/m;
