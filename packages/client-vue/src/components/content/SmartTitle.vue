<template>
  <i18n-t
    v-if="meta.hasKeywords"
    :keypath="`${props.i18nKey}.text`"
    :tag="props.tag"
    :for="`${props.i18nKey}.text`"
    :class="cn(styles.title, props.class)"
    :plural="plural"
  >
    <template v-for="keyword in keywords" :key="keyword">
      <component
        :is="getComponent(keyword)"
        :data-content="t(`${props.i18nKey}.${keyword}`)"
      >
        {{ t(`${props.i18nKey}.${keyword}`) }}
      </component>
    </template>
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
import config from "./content.config";
import { useStyles, cn } from "@upmind-automation/upmind-ui";

// --- utils
import { includes, isString, keys, omit, isEmpty } from "lodash-es";

// --- types
import type { SmartTitleProps } from "./types";
import type { ComputedRef } from "vue";
const props = withDefaults(defineProps<SmartTitleProps>(), {
  align: "left",
  plural: 0,
  tag: "h3",
});

const { t, tm } = useI18n();

const keywords = computed(() => {
  const value = tm(`${props.i18nKey}`) || {};
  return isString(value) ? undefined : keys(omit(value, "text"));
});

const meta = computed(() => {
  return {
    hasKeywords: !isEmpty(keywords.value),
    align: props.align,
    size: props.size,
  };
});

const styles = useStyles(["title", "keyword"], meta, config) as ComputedRef<{
  title: string;
  keyword: string;
}> as ComputedRef<{ title: string; keyword: string }>;

function getComponent(keyword: string) {
  // these are the allowed tags for injecting keywords inline in the title
  return includes(
    [
      "span",
      "strong",
      "em",
      "mask",
      "i",
      "b",
      "big",
      "small",
      "abbr",
      "acronym",
      "sub",
      "sup",
    ],
    keyword
  )
    ? keyword
    : "span"; // default to span
}
</script>
