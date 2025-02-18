<template>
  <aside :class="styles.clientEmpty.root">
    <h4 :class="styles.clientEmpty.title">
      {{ t(`client.${i18nKey}.empty.title`) }}
    </h4>
    <p :class="styles.clientEmpty.text">
      {{ t(`client.${props.i18nKey}.empty.text`) }}
    </p>
  </aside>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";

// --- internal
import { useStyles } from "@upmind-automation/upmind-ui";
import config from "./client.config";
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------

const props = defineProps<{
  i18nKey: string;
}>();

const { t } = useI18n();
const styles = useStyles(["clientEmpty"], {}, config) as ComputedRef<{
  clientEmpty: {
    root: string;
    title: string;
    text: string;
  };
}>;
</script>
