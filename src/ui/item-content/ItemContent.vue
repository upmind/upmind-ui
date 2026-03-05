<template>
  <span :class="styles.itemContent.root">
    <span :class="styles.itemContent.content">
      <span :class="styles.itemContent.group">
        <span :class="styles.itemContent.header.root">
          <slot name="primary">
            <span :class="styles.itemContent.header.primary">
              <slot name="prepend" />
              <strong v-if="item?.label" :class="styles.itemContent.label">
                {{ item.label }}
              </strong>
              <Badge v-if="item?.badge" v-bind="item.badge" size="sm" />
            </span>
          </slot>

          <slot name="secondary">
            <span
              v-if="item?.secondaryLabel || item?.secondaryBadge"
              :class="styles.itemContent.header.secondary"
            >
              <Badge
                v-if="item?.secondaryBadge"
                v-bind="item.secondaryBadge"
                size="sm"
              />
              <strong
                v-if="item?.secondaryLabel"
                :class="styles.itemContent.secondaryLabel"
              >
                {{ item.secondaryLabel }}
              </strong>
            </span>
          </slot>
        </span>

        <slot name="description">
          <span
            v-if="item?.description"
            :class="styles.itemContent.description"
          >
            {{ item.description }}
          </span>
        </slot>

        <span
          v-if="item?.secondaryDescription"
          :class="styles.itemContent.secondaryDescription"
        >
          {{ item.secondaryDescription }}
        </span>
      </span>
    </span>

    <Link
      v-if="item?.action"
      v-show="isNil(item.action?.visible) || item.action?.visible"
      v-bind="item.action"
      :class="styles.itemContent.header.action"
      color="muted"
      size="sm"
      @click.stop="onAction"
    />

    <slot name="append" />
  </span>
</template>

<script setup lang="ts">
/**
 * Shared content layout for card-based selection components.
 *
 * Extracts the common label / badge / description / action layout used by
 * CheckboxCards, RadioCards, SelectCards, and SelectGrouped into a single
 * reusable component. Structure mirrors the Figma UpmRadioRowCore atom:
 *
 *   root (flex-wrap container)
 *   ├── content (flex-1, additional content gets gap-4)
 *   │   └── group (gap-1, header + descriptions)
 *   │       ├── header (flex-wrap)
 *   │       │   ├── primary (label + badge)
 *   │       │   └── secondary (secondary badge + label)
 *   │       ├── description
 *   │       └── secondaryDescription
 *   ├── action link
 *   └── #append slot
 *
 * Slots:
 * - #prepend: Content before label (e.g., image/avatar)
 * - #primary: Override left header content (label + badge area)
 * - #secondary: Override right header content (secondary label + badge area)
 * - #description: Override description
 * - #append: Content after action link at root level (e.g., pricing)
 */
// --- external
import { computed } from "vue";
// --- internal
import { Badge } from "../badge";
import { Link } from "../link";
import config from "./itemContent.config";
import { useStyles } from "../../utils";
// --- utils
import { isNil } from "lodash-es";
// --- types
import type { ItemContentItemProps } from "./types";
// -----------------------------------------------------------------------------

const props = defineProps<{
  item?: ItemContentItemProps;
}>();

const emit = defineEmits<{
  action: [event: Event];
}>();

const meta = computed(() => ({}));

const styles = useStyles<typeof config>(
  ["itemContent", "itemContent.header"],
  meta,
  config
);

function onAction(event: Event) {
  event.stopPropagation();
  event.preventDefault();
  emit("action", event);
}
</script>
