<template>
  <h3 v-if="meta.isString" :class="styles.title">{{ title }}</h3>
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

const styles = useStyles(["title", "keyword"], meta, config, {
  dynamic: ["keyword"],
}) as ComputedRef<{
  title: string;
  keyword: (props: { keyword: string }) => string;
}>;

const formattedTitle = computed(() => {
  if (meta.value.isKeyword) {
    return replace(props.title.text, /{(\w+)}/g, (match, key) => {
      return `<keyword class="${styles.value.keyword({ keyword: key.toLowerCase() })}">${props.title.keywords[key]}</keyword>`;
    });
  }

  return props.title;
});
</script>
