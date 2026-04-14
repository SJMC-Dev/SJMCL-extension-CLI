# create-sjmcl-extension

`create-sjmcl-extension` scaffolds a bundled SJMCL extension project.

SJMCL currently loads a single frontend entry file from `sjmcl.ext.json`, while real extensions often want a `src/` tree and npm dependencies. This package bridges that gap by generating a small build pipeline around the SJMCL extension format.

## Usage

```bash
npm create sjmcl-extension@latest my-extension
```

You can also run:

```bash
npx create-sjmcl-extension my-extension
```

## Generated Project

The generated project includes:

- `npm run build`
  Bundles `src/index.ts` into the manifest's `frontend.entry`, copies extension files into `dist/<identifier>/`, and creates `dist/<identifier>-<version>.sjmclx`.
- `npm run bump -- <semver>`
  Sets both `package.json` and `sjmcl.ext.json` to the exact version you provide.
  
References:

- [SJMCL extension system overview](https://mc.sjtu.cn/sjmcl/en/dev/extension/)
- [SJMCL extension file structure](https://mc.sjtu.cn/sjmcl/en/dev/extension/file-structure.html)
- [SJMCL extension quick start](https://mc.sjtu.cn/sjmcl/en/dev/extension/quick-start.html)
