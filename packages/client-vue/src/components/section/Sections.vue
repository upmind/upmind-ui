<template>
  <div :class="styles.section.wrapper">
    <div v-if="!active" v-show="!props.disabled" :class="props.class">
      <slot name="default" />
    </div>

    <Tabs
      v-else
      :tabs="sections"
      v-model="modelValue"
      :border="meta.hasBorder"
      align="between"
      :overflow="sections.length > 1 ? 'hidden' : 'visible'"
      :data-testid="`section-${kebabCase(first(sections)?.label ?? 'default')}`"
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
        <!-- Disabled keeps the content mounted (payment iframes must survive),
             so hide it rather than unmount it. -->
        <div
          v-show="!props.disabled"
          :class="cn(styles.section.content, props.class)"
        >
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
  </div>
</template>

<script setup lang="ts">
// --- external
import { computed, useSlots } from "vue";

// --- components
import { Tabs, useStyles, Link, cn } from "@upmind-automation/upmind-ui";

// --- internal
import config from "./section.config";
import { useSection } from "./useSection";

// --- utils
import {
  find,
  first,
  isFunction,
  isString,
  isNil,
  kebabCase,
  isEmpty
} from "lodash-es";

// --- types
import type { SectionActionProps, SectionsProps } from "./types";

// -----------------------------------------------------------------------------
const props = withDefaults(defineProps<SectionsProps>(), {
  active: true,
  border: undefined,
  // undefined (not Vue's Boolean-cast false) so an unset prop falls through to
  // the section store — otherwise `props.inset ?? store` short-circuits on false
  card: undefined,
  inset: undefined
});

const emits = defineEmits<{
  reject: [Event];
  resolve: [Event];
  click: [Event];
  action: [{ name: string; event: Event }];
}>();

const modelValue = defineModel<SectionsProps["modelValue"]>("modelValue", {});

const { card, border, inset: insetDefault } = useSection();
const slots = useSlots();

const currentSectionProps = computed(() => {
  return (
    find(props.sections, { value: modelValue.value }) ?? first(props.sections)
  );
});

const hasActions = computed(() => {
  const hasActionContent =
    !!slots.actions || !isEmpty(currentSectionProps.value?.actions);
  return hasActionContent && !props.disabled;
});

const meta = computed(() => {
  const hasCard = props.card ?? card.value;
  // Inset: the card wraps the header + content with the header's own divider,
  // so suppress the tabs' full-width bottom border. Enclosed keeps the header
  // outside the card (card sits on the content only), as originally. The
  // default comes from the active template via the section store.
  const isInset = hasCard && (props.inset ?? insetDefault.value);
  const hasBorder = !isInset && (props.border ?? border.value);
  return { hasCard, hasBorder, isInset, isDisabled: props.disabled };
});

const styles = useStyles(
  ["section", "section.title", "section.tabs"],
  meta,
  config,
  props.uiConfig ?? {}
);

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
