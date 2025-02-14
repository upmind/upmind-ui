<template>
  <h3 v-if="meta.isString" :class="styles.title" class="m-0">{{ title }}</h3>

  <h3
    v-if="meta.isKeyword"
    :class="styles.title"
    v-html="
      template(title.text)({
        keyword: `<keyword class='${styles.keyword}'>${title.keyword}</keyword>`,
      })
    "
  />
</template>

<script setup lang="ts">
// --- external
import { isString, template } from "lodash-es";
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
  isKeyword: !isString(props.title) && props.title?.keyword,
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
</script>
