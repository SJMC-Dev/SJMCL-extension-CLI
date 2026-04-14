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
mkdir -p /tmp/sjmcl-cli-test
cd /tmp/sjmcl-cli-test

npm exec --yes \
  --package /path/to/create-sjmcl-extension-0.1.0.tgz \
  create-sjmcl-extension my-test-extension
```

Then test the generated project:

```bash
cd my-test-extension
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
