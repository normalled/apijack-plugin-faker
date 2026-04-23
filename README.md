# @apijack/plugin-faker

Wrap [@faker-js/faker](https://www.npmjs.com/package/@faker-js/faker) for apijack routines. Call any faker function by dotted path from routine YAML with the exact same arguments you'd use in JavaScript.

## Install

```bash
bun add @apijack/plugin-faker
# or: npm install @apijack/plugin-faker
```

Requires `@apijack/core` `^1.0.0` as a peer dependency.

## Usage

Register the plugin on your CLI:

```ts
import { createCli } from '@apijack/core';
import faker from '@apijack/plugin-faker';

const cli = createCli({ name: 'mycli', /* ... */ });
cli.use(faker());                       // zero-config
cli.use(faker({ seed: 42 }));           // global defaults
await cli.run();
```

Call `$_faker(path, ...args)` in a routine:

```yaml
name: seed-users
plugins:
  faker:
    seed: 42
    locale: en
steps:
  - name: create
    command: users create
    args:
      --name:  '$_faker(person.fullName)'
      --email: '$_faker(internet.email)'
      --age:   '$_faker(number.int, {min: 18, max: 80})'
      --tags:  '$_faker(helpers.arrayElements, ["ops", "sales", "eng"], 2)'
```

The first arg is the faker path (dotted, unquoted). Remaining args are JSON5-parsed — so unquoted keys, single quotes, and multi-line layouts all work:

```yaml
--user: |
  $_faker(person.fullName, {
    firstName: "Alex",
    sex: 'female',
    locale: en,
  })
```

## `$ref` substitution

To splice a routine variable into a faker call, quote the `$ref` inside the arg:

```yaml
variables:
  role: "admin"
steps:
  - name: mk
    command: users create
    args:
      --name: '$_faker(internet.username)'
      --tag:  '$_faker(helpers.arrayElement, ["user", "$role"])'
```

An exact-match quoted `$ref` like `"$role"` substitutes with the resolved value in its native type. A quoted interpolated string like `"tag-$role-v2"` yields a string.

## Seed and locale per routine

Per-routine options go under `plugins.faker:`:

```yaml
name: deterministic-check
plugins:
  faker:
    seed: 7
    locale: de
steps: [...]
```

Each routine invocation gets a fresh `Faker` instance. Routines are isolated from each other — seed state never leaks across routines.

## Path reference

The plugin walks faker's object graph, so every path in the [faker docs](https://fakerjs.dev/api/) works: `person.firstName`, `internet.email`, `number.int`, `helpers.arrayElement`, `date.past`, `string.alpha`, and so on.

## Versioning

Plugin major versions track `@apijack/core` major versions. A plugin `v1.x.x` is compatible with any `@apijack/core@^1.0.0`. When core bumps major, the plugin bumps major in lockstep.

## License

MIT.
