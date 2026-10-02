<template>
  <UpmProductConfig
    :meta="configMeta"
    hide-terms
    no-footer
    as="fieldset"
    autosave
    data-test-key="contract-product-upgrade-form"
  />
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module scenarios/overlay-upgrade/MigrationForm
 * @description The configurator of the chosen plan: `Config` drawn over
 * `migrationConfig`, as `BasketProduct.vue` draws it over a basket product.
 * `Config` injects the configurator by key, and the form renderers inside it
 * call `useConfig()` with no arguments, so both are provided here.
 *
 * It binds no `@resolve`: the commit is `migrate()` only. The provision fields
 * and the trial choice are not in `migrationConfig`, so they are not drawn.
 */

import { provide } from "vue";
import { UIContext, useConfig } from "@upmind-automation/client-vue";
import { Config as UpmProductConfig } from "@upmind-automation/product";
import type { MigrationConfig } from "@upmind-automation/client-vue";

// -----------------------------------------------------------------------------

const props = defineProps<{ config: MigrationConfig }>();

const configMeta = useConfig({
  context: UIContext.CONFIGURE,
  product: () => props.config.product.value,
  provide: true
});

provide("useProductConfig", props.config);
</script>
