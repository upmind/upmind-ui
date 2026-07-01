<template>
  <Lineclamp
    :disabled="!lineclamp"
    :label-more="t('action.show_more')"
    :label-less="t('action.show_less')"
    :lines="lines"
  >
    <Markdown :class="props.class" tag="p" inline :model-value="description" />
  </Lineclamp>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { Lineclamp, Markdown } from "@upmind-automation/upmind-ui";
import type { ProductDescriptionProps } from "./types";

const props = withDefaults(defineProps<ProductDescriptionProps>(), {
  lineclamp: true,
  lines: 3,
  class: ""
});

const { t } = useI18n();
</script>
