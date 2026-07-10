<template>
  <div
    v-if="!active"
    :class="props.class"
    v-bind="sectionTestAttrs(first(sections)?.value ?? 'default')"
  >
    <slot name="default" />
  </div>

  <Tabs
    v-else
    :tabs="sections"
    v-model="modelValue"
    :border="meta.hasBorder"
    align="between"
    :overflow="sections.length > 1 ? 'hidden' : 'visible'"
    v-bind="sectionTestAttrs(first(sections)?.value ?? 'default')"
    :ui-config="{
      tabs: {
        root: [styles.section.tabs.root],
        list: [styles.section.tabs.list],
        trigger: [styles.section.tabs.trigger],
        indicator: [styles.section.tabs.indicator],
        icon: [styles.section.tabs.icon]
      }
    }"
  >
    <template #prepend>
      <slot name="prepend" />
    </template>

    <template
      v-for="section in sections"
      :key="section.value"
      #[`content.${section.value}`]
    >
      <div :class="cn(styles.section.content, props.class)">
        <slot
          v-if="slots[`section-${section.value}`]"
          :name="`section-${section.value}`"
        />
        <slot v-else name="default" />
      </div>
    </template>

    <template v-if="hasActions" #append>
      <!-- actions -->
      <slot name="actions">
        <Link
          v-for="(action, key) in currentSectionProps?.actions"
          v-show="isNil(action.visible) || action.visible"
          :key="key"
          v-bind="action"
          color="muted"
          size="sm"
          @click="doAction(action, $event)"
        />
      </slot>
    </template>
  </Tabs>
</template>

<script setup lang="ts">
import { computed, useSlots } from "vue";
import {
  Tabs,
  useStyles,
  useTestAttrs,
  Link,
  cn
} from "@upmind-automation/upmind-ui";
import config from "./section.config";
import { useSection } from "./useSection";
import { find, first, isFunction, isString, isNil, isEmpty } from "lodash-es";
import type { SectionActionProps, SectionsProps } from "./types";

// -----------------------------------------------------------------------------
const props = withDefaults(defineProps<SectionsProps>(), {
  active: true,
  border: undefined,
  card: undefined
});

const emits = defineEmits<{
  reject: [Event];
  resolve: [Event];
  click: [Event];
  action: [{ name: string; event: Event }];
}>();

const modelValue = defineModel<SectionsProps["modelValue"]>("modelValue", {});

const { card, border } = useSection();
const slots = useSlots();

const currentSectionProps = computed(() => {
  return (
    find(props.sections, { value: modelValue.value }) ?? first(props.sections)
  );
});

const hasActions = computed(
  () => !!slots.actions || !isEmpty(currentSectionProps.value?.actions)
);

const meta = computed(() => ({
  hasCard: props.card ?? card.value,
  hasBorder: props.border ?? border.value
}));

const styles = useStyles(
  ["section", "section.title", "section.tabs"],
  meta,
  config,
  props.uiConfig ?? {}
);

/* dataAttrs lets consumers (e.g. BillingForm's 'billing' key) override the
   default section key through the strip-in-PROD path. */
const sectionTestAttrs = (value?: string) =>
  useTestAttrs({ key: "section", value, dataAttrs: props.dataAttrs });

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
