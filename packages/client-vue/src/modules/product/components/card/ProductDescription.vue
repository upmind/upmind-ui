<template>
  <ClampText
    v-if="lineclamp"
    :lines="lines"
    :show-more-label="t('action.show_more')"
    :show-less-label="t('action.show_less')"
  >
    <Markdown :class="props.class" tag="p" inline :model-value="description" />
  </ClampText>
  <Markdown
    v-else
    :class="props.class"
    tag="p"
    inline
    :model-value="description"
  />
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { ClampText, Markdown } from "@upmind/ui";
import type { ProductDescriptionProps } from "./types";

const props = withDefaults(defineProps<ProductDescriptionProps>(), {
  lineclamp: true,
  lines: 3,
  class: ""
});

const { t } = useI18n();
</script>
