[Upmind](../packages.md) / @upmind-automation/headless

# Getting Started

## Prerequisites

`headless-vue` is a collection of Vue 3 composables.

- If you don't have a Vue 3 app, have a look at Vue [Quick Start](https://vuejs.org/guide/quick-start.html) guide.

- We also assume that you are familiar with the basic concepts of the [Composition API](https://vuejs.org/guide/extras/composition-api-faq.html).

## Installation

```
npm i @upmind-automation/headless
```

## Usage simple example

Simply importing the composables (functions) you need from `@upmind-automation/headless`.

```vue
<script setup>
import { useSession } from "@upmind-automation/headless";

const { meta, errors, showLogin, verify2fa, resolve, reject } = useSession();

return {
  meta,
  errors,
  showLogin,
  showRegister,
  verify2fa,
  resolve,
  reject,
};
</script>
```

## API Reference

Refer to all [functions list](./globals.md) for more details.
