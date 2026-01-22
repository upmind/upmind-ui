<template>
  <div
    v-if="
      title ||
      description ||
      !isEmptySlot('prepend', slots) ||
      !isEmptySlot('append', slots)
    "
    :class="styles.categories.header.root"
    v-auto-animate
  >
    <slot name="prepend" />

    <div :class="styles.categories.header.title.root">
      <h1
        v-if="title"
        :class="styles.categories.header.title.text"
        data-testid="title"
      >
        {{ title }}
      </h1>

      <Badge
        v-if="props.badge"
        v-bind="isString(props.badge) ? { label: props.badge } : props.badge"
        variant="minimal"
        color="neutral"
      />
    </div>

    <p v-if="description" :class="styles.categories.header.description">
      {{ description }}
    </p>

    <p v-if="excerpt" :class="styles.categories.header.description">
      {{ excerpt }}
    </p>

    <slot name="append" />
  </div>
</template>

<script setup lang="ts">
// --- external
import { computed, useSlots } from "vue";
import { vAutoAnimate } from "@formkit/auto-animate";

// --- internal
import { useStyles, Badge } from "@upmind-automation/upmind-ui";
import config from "../catalogue.config";

// --- utils
import { isEmptySlot } from "@upmind-automation/upmind-ui";
import { isString } from "lodash-es";

// --- types
import type { CategoriesProps, CategoriesItemProps } from "./types";

// -----------------------------------------------------------------------------

const props = defineProps<CategoriesItemProps>();

const modelValue = defineModel<CategoriesProps["modelValue"]>("modelValue");

const slots = useSlots();

// -----------------------------------------------------------------------------

const meta = computed(() => {
  return {
    isLoading:
      (modelValue.value && !props.id) || (!modelValue.value && !props.name)
  };
});

const styles = useStyles(
  ["categories", "categories.header", "categories.header.title"],
  meta,
  config
);
</script>
