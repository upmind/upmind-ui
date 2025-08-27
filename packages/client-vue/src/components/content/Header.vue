<template>
  <header class="flex flex-col gap-3">
    <Badge v-if="badge" v-bind="badge" variant="outline" color="primary" />

    <article :class="styles.header.root">
      <SmartTitle
        v-if="meta.hasSmartTitle"
        :i18n-key="title!"
        :class="styles.header.title"
      />
      <h1 v-else :class="styles.header.title">
        <template v-if="meta.hasi18nTitle">
          {{ $t(title!) }}
        </template>
        <template v-else>
          {{ title }}
        </template>
      </h1>

      <p :class="styles.header.description">
        <slot name="description">
          {{ description }}
        </slot>
      </p>
    </article>
  </header>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";
import { useI18n } from "vue-i18n";

// --- components
import { Badge } from "@upmind-automation/upmind-ui";
import SmartTitle from "./SmartTitle.vue";

// --- internal
import config from "./content.config";
import { useStyles } from "@upmind-automation/upmind-ui";

// --- types
import type { ComputedRef } from "vue";
import type { BadgeProps } from "@upmind-automation/upmind-ui";

const { te } = useI18n();

const props = defineProps<{
  badge?: BadgeProps;
  title?: string;
  description?: string;
}>();

const meta = computed(() => ({
  hasSmartTitle: !!props.title && te(`${props.title}.text`),
  hasi18nTitle: !!props.title && te(`${props.title}`)
}));

const styles = useStyles(["header"], meta, config) as ComputedRef<{
  header: {
    root: string;
    title: string;
    description: string;
  };
}>;
</script>
