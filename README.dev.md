# README.dev

## Local debug

Install dependencies:

```bash
npm install
```

Run the CLI from source:

```bash
node ./bin/create-sjmcl-extension.js
```

## Local package test

Pack the current CLI:

```bash
npm pack
```

Test the generated `.tgz`:

```bash
npm exec --yes \
  --package ./create-sjmcl-extension-0.3.0.tgz \
  create-sjmcl-extension test
```

Then test the generated project:

```bash
cd test
npm install
npm run build
npm run bump -- 0.1.1
```


## Publish

Check the publish payload:

```bash
npm pack --dry-run
```

Publish to npm:

```bash
npm publish --registry=https://registry.npmjs.org/
```
