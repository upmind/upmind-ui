<template>
  <!-- Inset carries the card box here, so the header renders inside it. -->
  <div :class="wrapperVariants({ isInset: meta.isInset })">
    <!-- Disabled keeps the content mounted (payment iframes must survive), so
         hide it rather than unmount it. -->
    <div
      v-if="!active"
      v-show="!meta.isDisabled"
      :class="props.class"
      v-bind="sectionTestAttrs(first(sections)?.value ?? 'default')"
    >
      <slot name="default" />
    </div>

    <Tabs
      v-else
      v-model="modelValue"
      :default-value="first(sections)?.value"
      :tabs="tabItems"
      variant="underline"
      align="between"
      overflow="clip"
      :border="false"
      :ui="{
        header: headerVariants({
          hasBorder: meta.hasBorder,
          isInset: meta.isInset,
          isDisabled: meta.isDisabled
        }),
        heading: sectionHeadingVariants({
          hasIcon: meta.hasIcon,
          isInset: meta.isInset,
          isDisabled: meta.isDisabled
        }),
        content: cn(!meta.hasBorder && 'mt-0')
      }"
      :data-attrs="sectionTestAttrs(first(sections)?.value ?? 'default')"
    >
      <template
        v-for="section in sections"
        :key="`tab-${section.value}`"
        #[`tab.${section.value}`]
      >
        <!-- the glyphs draw bottom-weighted in their box, so centring drops
             them under the baseline; the forced svg size beats TabsTrigger's
             own cap, so a tabbed section matches a lone one -->
        <Icon
          v-if="section.icon"
          :icon="section.icon"
          size="sm"
          class="relative -top-0.5 [&>svg]:size-5!"
        />
        {{ section.label }}
      </template>

      <template v-if="slots.prepend" #prepend><slot name="prepend" /></template>

      <template v-if="hasActions" #append>
        <div class="flex items-center gap-2">
          <slot name="actions">
            <Link
              v-for="(action, key) in currentSectionProps?.actions"
              v-show="isNil(action.visible) || action.visible"
              :key="key"
              :to="action.to"
              :href="action.href"
              :type="action.type"
              v-bind="action.dataAttrs"
              color="muted"
              size="sm"
              @click="doAction(action, $event)"
            >
              <Icon v-if="action.icon" :icon="action.icon" />
              {{ action.label }}
            </Link>
          </slot>
        </div>
      </template>

      <template
        v-for="section in sections"
        :key="`content-${section.value}`"
        #[`content.${section.value}`]
      >
        <div
          v-show="!meta.isDisabled"
          :class="
            cn(
              sectionContentVariants({
                hasCard: meta.hasCard,
                isInset: meta.isInset
              }),
              props.class
            )
          "
        >
          <slot
            v-if="slots[`section-${section.value}`]"
            :name="`section-${section.value}`"
          />
          <slot v-else name="default" />
        </div>
      </template>
    </Tabs>
  </div>
</template>

<script setup lang="ts">
import { Link, Tabs, cn, useSlots, useTestAttrs } from "@upmind/ui";
import { computed } from "vue";
import { Icon } from "../icon";
import { useSection } from "./useSection";
import {
  headerVariants,
  sectionContentVariants,
  sectionHeadingVariants,
  wrapperVariants
} from "./variants";
import {
  assign,
  find,
  first,
  isFunction,
  isString,
  isNil,
  isEmpty,
  kebabCase,
  map
} from "lodash-es";
import type { SectionActionProps, SectionsProps } from "./types";
import type { TabItem } from "@upmind/ui";

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
  const hasIcon = !!first(props.sections)?.icon;
  return { hasCard, hasBorder, hasIcon, isInset, isDisabled: props.disabled };
});

// The tab-{label} keys are the e2e contract; a section's own dataAttrs win.
// A lone section degrades to a heading and keeps these hooks (Tabs routes them).
const tabItems = computed<TabItem[]>(() =>
  map(props.sections, section => ({
    value: section.value,
    label: section.label,
    eager: section.eager,
    dataAttrs: assign(
      { "data-test-key": `tab-${kebabCase(section.label)}` },
      section.dataAttrs
    )
  }))
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
