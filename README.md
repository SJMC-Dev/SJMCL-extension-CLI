# Create-SJMCL-Extension CLI

`create-sjmcl-extension` scaffolds an SJMCL extension project with a local build pipeline for `src/` tree and npm dependencies.

## Install

```bash
npm install -g create-sjmcl-extension@latest
```

## Usage

```bash
npx create-sjmcl-extension
```

## CLI Options

| Option | Value | Default | Description |
| --- | --- | --- | --- |
| `project-directory` | path | `my-sjmcl-extension` | Target directory for the generated project. |
| `-h`, `--help` | none | off | Show the CLI help screen. |

It will interactively prompt for the new extenion's metadata.

## Generated Project

The generated project includes a small build pipeline and two project scripts:

### `npm run build`

Builds the extension package from the local source tree.

Build characteristics:

- Source entry: `src/index.ts` or `src/index.tsx`
- JSX transform: `React.createElement(...)`
- Default output: minified production bundle

Build options:

| Flag | Value | Default | Effect |
| --- | --- | --- | --- |
| `--mode` | `production`, `development` | `production` | Selects the overall build profile and sets `process.env.NODE_ENV`. `production` enables syntax and whitespace minification for a compact release bundle; `development` keeps the output more readable for inspection and debugging. |
| `--obfuscate` | none or boolean (`true`, `false`, `1`, `0`, `yes`, `no`, `on`, `off`) | on in production, off in development | Controls identifier minification only. It renames local symbols to shorter names, but it does not switch build mode or enable syntax/whitespace minification by itself. |

In short: `--mode` chooses the overall output style, while `--obfuscate` only toggles identifier mangling.

```bash
npm run build
npm run build -- --mode development
npm run build -- --obfuscate
npm run build -- --obfuscate=off
npm run build -- --mode development --obfuscate=off
```

Build output files:

- `dist/<identifier>/`
- `dist/<identifier>-<version>.sjmclx`

The build script also copies these files into the packaged output when present:

- `sjmcl.ext.json`
- `icon.png`
- `assets/`
- `data/`

### `npm run bump -- <semver>`

Updates both `package.json` and `sjmcl.ext.json` to the exact version you provide.

### Host-Provided Singleton Packages

Direct imports from these packages are rejected at build time:

| Package | Use Instead |
| --- | --- |
| `react` | `api.React` |
| `@chakra-ui/react` | `api.ChakraUI` |

If a third-party dependency bundles them transitively, the build still succeeds and emits warnings that include:

- the bundled singleton package name
- the byte contribution in the final output
- one or more dependency chains from project source to the bundled package

## References

- [SJMCL extension system overview](https://mc.sjtu.cn/sjmcl/en/dev/extension/)
- [SJMCL extension file structure](https://mc.sjtu.cn/sjmcl/en/dev/extension/file-structure.html)
- [SJMCL extension quick start](https://mc.sjtu.cn/sjmcl/en/dev/extension/quick-start.html)
