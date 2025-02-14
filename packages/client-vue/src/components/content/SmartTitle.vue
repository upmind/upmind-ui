<template>
  <h3 v-if="meta.isString" :class="styles.title" class="m-0">{{ title }}</h3>

  <h3 v-if="meta.isKeyword" :class="styles.title" v-html="formattedTitle"></h3>
</template>

<script setup lang="ts">
// --- external
import { isString, replace } from "lodash-es";
import { computed } from "vue";

// --- internal
import config from "./config.cva";
import { useStyles } from "@upmind-automation/upmind-ui";

// --- types
import type { SmartTitleProps } from "./types";
import type { ComputedRef } from "vue";

const props = withDefaults(defineProps<SmartTitleProps>(), {
  align: "left",
});

const meta = computed(() => ({
  isKeyword: !isString(props.title) && !!props.title?.keywords,
  isString: isString(props.title),
  align: props.align,
}));

const styles = useStyles(
  ["title", "keyword"],
  meta,
  config,
  {}
) as ComputedRef<{
  title: string;
  keyword: string;
}>;

const formattedTitle = computed(() => {
  if (meta.value.isKeyword) {
    return replace(props.title.text, /{(\d+)}/g, (match, index) => {
      return `<keyword class="${styles.value.keyword}">${props.title.keywords[index]}</keyword>`;
    });
  }

  return props.title;
});
</script>
