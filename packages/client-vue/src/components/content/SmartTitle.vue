<template>
  <h3 :class="cn(styles.title, props.class)" v-html="formattedTitle" />
</template>

<script setup lang="ts">
// --- external
import { isString, replace } from "lodash-es";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

// --- internal
import config from "./config.cva";
import { useStyles, cn } from "@upmind-automation/upmind-ui";

// --- types
import type { SmartTitleProps, TitleProperties } from "./types";
import type { ComputedRef } from "vue";
const props = withDefaults(defineProps<SmartTitleProps>(), {
  align: "left",
  plural: 0,
});

const { t, tm } = useI18n();

const meta = computed(() => ({
  align: props.align,
  size: props.size,
}));

const styles = useStyles(["title", "keyword"], meta, config, {
  dynamic: ["keyword"],
}) as ComputedRef<{
  title: string;
  keyword: (props: { keyword: string }) => string;
}>;

const formattedTitle = computed(() => {
  const textKey = `${props.i18nKey}.text`;
  let title = t(textKey, props.plural);
  if (title === textKey) {
    title = t(props.i18nKey, props.plural);
  }

  let properties = tm(props.i18nKey) as TitleProperties;

  if (properties.keywords) {
    title = replace(title, /~(\w+)~/g, (match, key) => {
      return `<keyword class="${styles.value.keyword({ keyword: key.toLowerCase() })}">${properties.keywords[key]}</keyword>`;
    });
  }
  return title;
});
</script>
