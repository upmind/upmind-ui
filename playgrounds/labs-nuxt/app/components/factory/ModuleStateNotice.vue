<template>
  <Alert
    :color="content.color"
    :icon="content.icon"
    :title="content.title"
    :description="content.description"
    :class="styles.moduleStateNotice.root"
  >
    <pre v-if="formattedDetail" :class="styles.moduleStateNotice.detail">{{
      formattedDetail
    }}</pre>
  </Alert>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module factory/ModuleStateNotice
 * @description The shared scope-invalid/loading/error notice every archetype
 * surface renders in place of its normal content (design.md FE-2977 §Block C).
 */

import { computed } from "vue";
import { Alert, useStyles } from "@upmind-automation/upmind-ui";
import config from "./ModuleStateNotice.styles";
import type {
  ModuleStateContent,
  ModuleStateNoticeProps
} from "./ModuleStateNotice.types";
// -----------------------------------------------------------------------------

const props = defineProps<ModuleStateNoticeProps>();

const CONTENT: Record<ModuleStateNoticeProps["state"], ModuleStateContent> = {
  "scope-invalid": {
    color: "danger",
    icon: "lock-01",
    title: "Scope not permitted",
    description:
      "The active actor cannot access this module in the current scope."
  },
  loading: {
    color: "info",
    icon: "clock",
    title: "Loading",
    description: "The module is loading its data."
  },
  error: {
    color: "danger",
    icon: "alert-triangle",
    title: "Something went wrong",
    description: "The module reported an error."
  }
};

const content = computed(() => CONTENT[props.state]);

const formattedDetail = computed(() =>
  props.detail === undefined ? "" : JSON.stringify(props.detail, null, 2)
);

const meta = computed(() => ({ state: props.state }));
const styles = useStyles(["moduleStateNotice"], meta, config);
</script>
