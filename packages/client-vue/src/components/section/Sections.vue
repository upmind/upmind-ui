<template>
  <div v-if="!active" :class="props.class">
    <slot name="default" />
  </div>

  <Tabs
    v-else
    :tabs="sections"
    v-model="currentSection"
    :defaultValue="currentSection"
    :class="props.class"
  >
    <template
      v-for="section in sections"
      :key="section.value"
      #[`content.${section.value}`]
    >
      <div :class="styles.section.content">
        <slot
          v-if="slots[`section-${section.value}`]"
          :name="`section-${section.value}`"
        />
        <slot v-else name="default" />
      </div>
    </template>
  </Tabs>
</template>

<script setup lang="ts">
// --- external
import { computed, useSlots } from "vue";
import { useRoutingEngine } from "@upmind-automation/headless";

// --- components
import { Tabs, cn, useStyles } from "@upmind-automation/upmind-ui";

// --- internal
import config from "./section.config";
import { LAYOUT_VARIANTS } from "../layout";

// --- utils
import { first } from "lodash-es";

// --- types
import type { ComputedRef } from "vue";
import type { SectionsProps } from "./types";

// -----------------------------------------------------------------------------
const props = withDefaults(defineProps<SectionsProps>(), {
  active: true
});

const currentSection = defineModel<string>();
const { currentRoute } = useRoutingEngine();
const slots = useSlots();

if (props.defaultValue) {
  currentSection.value = props.defaultValue;
} else if (props.sections?.length) {
  currentSection.value = first(props.sections)?.value;
}

const meta = computed(() => ({
  variant: currentRoute.value?.meta?.template || LAYOUT_VARIANTS.DEFAULT
}));

const styles = useStyles(
  ["section", "section.title"],
  meta,
  config,
  props.uiConfig ?? {}
) as ComputedRef<{
  section: {
    root: string;
    header: string;
    title: {
      root: string;
      heading: string;
    };
    content: string;
  };
}>;
</script>
