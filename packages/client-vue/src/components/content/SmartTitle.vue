<template>
  <i18n-t
    v-if="hasKeyword"
    :keypath="`${props.i18nKey}.text`"
    tag="h3"
    :for="`${props.i18nKey}.text`"
    :class="cn(styles.title, props.class)"
    :plural="plural"
  >
    <keyword :class="styles.keyword">{{
      t(`${props.i18nKey}.keyword`)
    }}</keyword>
  </i18n-t>

  <h3 v-else :class="cn(styles.title, props.class)">
    {{ t(`${props.i18nKey}`) }}
  </h3>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import config from "./config.cva";
import { useStyles, cn } from "@upmind-automation/upmind-ui";

// --- types
import type { SmartTitleProps } from "./types";
import type { ComputedRef } from "vue";
const props = withDefaults(defineProps<SmartTitleProps>(), {
  align: "left",
  plural: 0,
});

const { t, te } = useI18n();

const hasKeyword = computed(() => te(`${props.i18nKey}.keyword`));

const meta = computed(() => ({
  align: props.align,
  size: props.size,
  keyword: hasKeyword.value ? t(`${props.i18nKey}.keyword`).toLowerCase() : "",
}));

const styles = useStyles(["title", "keyword"], meta, config) as ComputedRef<{
  title: string;
  keyword: string;
}>;
</script>
