<template>
  <div v-if="!active" :class="props.class" :data-testid="`section`">
    <slot name="default" />
  </div>

  <Tabs
    v-else
    :tabs="sections"
    v-model="modelValue"
    align="between"
    :overflow="sections.length > 1 ? 'hidden' : 'visible'"
    :class="props.class"
  >
    <template #prepend>
      <slot name="prepend" />
    </template>

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

    <template #append>
      <!-- actions -->
      <slot name="actions">
        <Link
          v-for="(action, key) in currentSectionProps?.actions"
          v-show="isNil(action.visible) || action.visible"
          :key="key"
          v-bind="action"
          color="muted"
          @click="doAction(action, $event)"
        />
      </slot>
    </template>
  </Tabs>
</template>

<script setup lang="ts">
// --- external
import { computed, useSlots } from "vue";
import { useRoutingEngine } from "@upmind-automation/headless";

// --- components
import { Tabs, cn, useStyles, Link } from "@upmind-automation/upmind-ui";

// --- internal
import config from "./section.config";
import { LAYOUT_VARIANTS } from "../layout";

// --- utils
import { find, first, isFunction, isString, isNil } from "lodash-es";

// --- types
import type { ComputedRef } from "vue";
import type { SectionActionProps, SectionsProps } from "./types";

// -----------------------------------------------------------------------------
const props = withDefaults(defineProps<SectionsProps>(), {
  active: true
});

const emits = defineEmits<{
  reject: [Event];
  resolve: [Event];
  click: [Event];
  action: [{ name: string; event: Event }];
}>();

const modelValue = defineModel<SectionsProps["modelValue"]>("modelValue", {});

const { currentRoute } = useRoutingEngine();
const slots = useSlots();

const currentSectionProps = computed(() =>
  find(props.sections, { value: modelValue.value })
);

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

function doAction(item: SectionActionProps, $event: Event) {
  $event.preventDefault(); // prevent default form actions as we are handling it ourselves

  if (isFunction(item.handler)) {
    item.handler($event);
    return;
  }

  if (isString(item.handler)) {
    emits("action", {
      name: item.handler,
      event: $event
    });
    return;
  }

  // fallback for submit/reset
  if (item.type === "submit") {
    emits("resolve", $event);
    return;
  } else if (item.type === "reset") {
    emits("reject", $event);
    return;
  }

  emits("click", $event);
}
</script>
