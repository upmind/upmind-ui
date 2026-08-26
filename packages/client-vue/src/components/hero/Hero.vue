<template>
  <header :class="heroRootVariants({ size: props.size })">
    <Badge
      v-if="heroBadge"
      :appearance="heroBadge.appearance ?? BADGE_APPEARANCE.OUTLINE"
      :variant="heroBadge.variant ?? BADGE_VARIANT.NEUTRAL"
    >
      <Icon v-if="heroBadge.icon" :icon="heroBadge.icon" size="xs" />
      {{ heroBadge.label }}
    </Badge>
    <hgroup>
      <slot name="prepend" />
      <h1
        :class="cn(heroTitleVariants(), props.titleClass)"
        v-bind="titleTestAttrs()"
      >
        <slot name="title">
          <Sanitized v-if="props.title" :html="props.title" />
        </slot>
      </h1>

      <component
        v-if="props.subtitle || $slots.subtitle"
        :is="$slots.subtitle ? 'div' : 'p'"
        :class="heroSubtitleVariants()"
      >
        <slot name="subtitle">
          {{ props.subtitle }}
        </slot>
      </component>

      <component
        v-if="!meta.hasSubtitle && meta.hasDescription"
        :is="$slots.description ? 'div' : 'p'"
        :class="cn(heroDescriptionVariants(), props.descriptionClass)"
      >
        <slot name="description">
          {{ props.description }}
        </slot>
      </component>
    </hgroup>

    <component
      v-if="meta.hasSubtitle && meta.hasDescription"
      :is="$slots.description ? 'div' : 'p'"
      :class="cn(heroDescriptionVariants(), props.descriptionClass)"
    >
      <slot name="description">
        {{ props.description }}
      </slot>
    </component>

    <div v-if="props.action">
      <Button
        variant="subtle"
        size="lg"
        :disabled="props.action.disabled"
        :loading="props.action.loading"
        v-bind="props.action.dataAttrs"
        @click="emit('action')"
      >
        <Icon v-if="props.action.icon" :icon="props.action.icon" />
        {{ props.action.label }}
      </Button>
    </div>

    <slot name="append" />

    <slot />
  </header>
</template>

<script setup lang="ts">
import { useTestAttrs } from "@upmind/ui";
import { Button, Sanitized, Badge, cn } from "@upmind/ui";
import { computed } from "vue";
import { BADGE_APPEARANCE, BADGE_VARIANT } from "@upmind-automation/headless";
import { Icon } from "../icon";
import {
  heroRootVariants,
  heroTitleVariants,
  heroSubtitleVariants,
  heroDescriptionVariants
} from "./variants";
import { isString } from "lodash-es";
import type { HeroProps } from "./types";

const props = defineProps<HeroProps>();
const slots = defineSlots();

const emit = defineEmits<{
  (e: "action"): void;
}>();

const titleTestAttrs = () =>
  useTestAttrs({ key: "hero-title", dataAttrs: props.dataAttrs });

const heroBadge = computed(() =>
  isString(props.badge) ? { label: props.badge } : props.badge
);

const meta = computed(() => ({
  hasSubtitle: !!props.subtitle || !!slots.subtitle,
  hasDescription: !props.loading && (!!props.description || !!slots.description)
}));
</script>
