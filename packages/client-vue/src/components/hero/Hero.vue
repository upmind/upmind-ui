<template>
  <header :class="styles.hero.root">
    <Badge
      v-if="badge"
      v-bind="isString(badge) ? { label: badge } : badge"
      class="shrink-0"
      variant="minimal"
      color="neutral"
    />
    <hgroup>
      <slot name="prepend" />
      <h1 :class="styles.hero.title">
        <slot name="title">
          <Sanitized v-if="props.title" :modelValue="props.title" />
        </slot>
      </h1>

      <component
        v-if="props.subtitle || $slots.subtitle"
        :is="$slots.subtitle ? 'div' : 'p'"
        :class="styles.hero.subtitle"
      >
        <slot name="subtitle">
          {{ props.subtitle }}
        </slot>
      </component>

      <component
        v-if="!hasSubtitle && hasDescription"
        :is="$slots.description ? 'div' : 'p'"
        :class="styles.hero.description"
      >
        <slot name="description">
          {{ props.description }}
        </slot>
      </component>
    </hgroup>

    <component
      v-if="hasSubtitle && hasDescription"
      :is="$slots.description ? 'div' : 'p'"
      :class="styles.hero.description"
    >
      <slot name="description">
        {{ props.description }}
      </slot>
    </component>

    <slot name="append" />

    <slot />
  </header>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";

// --- components
import { Badge } from "@upmind-automation/upmind-ui";

// --- internal
import config from "./hero.config";
import { useStyles, Sanitized } from "@upmind-automation/upmind-ui";

// --- utils
import { isString } from "lodash-es";

// --- types
import type { HeroProps } from "./types";

const props = defineProps<HeroProps>();
const slots = defineSlots();

const hasSubtitle = computed(() => !!props.subtitle || !!slots.subtitle);
const hasDescription = computed(
  () => !props.loading && (!!props.description || !!slots.description)
);

const styles = useStyles(["hero"], {}, config, props.uiConfig ?? {});
</script>
