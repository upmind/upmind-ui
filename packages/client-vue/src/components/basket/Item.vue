<template>
  <ProductConfig
    v-if="open || selected"
    v-bind="$props"
    :class="styles.basket.item"
    :processing="meta.isProcessing"
    :required="selected"
    @reject="open = false"
    @resolve="doResolve"
    @update:attributes="updateAttributes"
    @update:options="updateOptions"
    @update:provisioning="updateProvisioning"
    @update:quantity="updateQuantity"
    @update:term="updateTerm"
  >
    <template #header>
      <span v-if="meta.isNew">{{ t("basket.items.pending.title") }}</span>
      <span v-else-if="meta.hasErrors">{{
        t("basket.items.invalid.title")
      }}</span>
    </template>
  </ProductConfig>
  <ProductCard
    v-else
    v-bind="$props"
    :class="styles.basket.item"
    @reject="removeItem"
    @resolve="open = true"
  >
    <template #badges v-if="!meta.isLoading">
      <Badge
        v-if="meta.isNew"
        color="accent"
        variant="flat"
        :class="styles.basket.item.ping.root"
      >
        {{ t("basket.items.pending.badge") }}
      </Badge>
      <Badge
        v-else-if="meta.hasErrors"
        color="error"
        variant="flat"
        :class="styles.basket.item.ping.root"
      >
        {{ t("basket.items.invalid.badge") }}
      </Badge>
    </template>
  </ProductCard>
</template>

<script lang="ts" setup>
// --- external
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import {
  useProductConfig,
  useBasket,
  utils,
} from "@upmind-automation/headless-vue";
const { stateMatches } = utils;
import { useStyles, cn } from "@upmind-automation/upmind-ui";

import config from "./basket.config";

// --- components
import ProductCard from "../product/Card.vue";
import ProductConfig from "../product/Config.vue";

// --- custom elements
import { Badge } from "@upmind-automation/upmind-ui";

// --- types
import type { ComputedRef } from "vue";
import type { ActorRef } from "xstate";

// -----------------------------------------------------------------------------

const props = withDefaults(
  defineProps<{
    modelValue: string;
    item: ActorRef<any, any>;
    selected?: boolean;
  }>(),
  {
    selected: false,
  }
);

const { t } = useI18n();

const { removeItem, updateItem } = useBasket();

const {
  meta,
  updateAttributes,
  updateOptions,
  updateProvisioning,
  updateQuantity,
  updateTerm,
} = useProductConfig(props.item);

const styles = useStyles(
  ["basket.item", "basket.item.ping"],
  meta,
  config
) as ComputedRef<{
  basket: {
    item: string;
  };
}>;
// ---

const open = ref(props.selected);

async function doResolve() {
  updateItem(props.modelValue).then(item => {
    open.value = !stateMatches(item.state, ["available.complete"]);
  });
}
</script>
