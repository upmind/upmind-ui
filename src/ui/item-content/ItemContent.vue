<template>
  <span :class="styles.itemContent.root">
    <slot name="indicator" />
    <span :class="styles.itemContent.content">
      <span :class="styles.itemContent.group">
        <span :class="styles.itemContent.header.root">
          <slot name="primary">
            <span :class="styles.itemContent.header.primary">
              <slot name="prepend" />
              <strong v-if="item?.label" :class="styles.itemContent.label">
                {{ item.label }}
              </strong>
              <Badge
                v-for="(item, index) in badges"
                :key="index"
                v-bind="item"
                size="sm"
              />
            </span>
          </slot>

          <slot name="secondary">
            <span
              v-if="item?.secondaryLabel || secondaryBadges.length"
              :class="styles.itemContent.header.secondary"
            >
              <Badge
                v-for="(item, index) in secondaryBadges"
                :key="index"
                v-bind="item"
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

      <slot name="append" />
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
  </span>
</template>

<script setup lang="ts">
// --- external
import { computed } from "vue";
// --- internal
import { Badge } from "../badge";
import { Link } from "../link";
import config from "./itemContent.config";
import { useStyles } from "../../utils";
// --- utils
import { castArray, isNil } from "lodash-es";
// --- types
import type { ItemContentItemProps } from "./types";
// -----------------------------------------------------------------------------

const props = withDefaults(
  defineProps<{
    item?: ItemContentItemProps;
    size?: "sm" | "md";
  }>(),
  { size: "sm" }
);

const emit = defineEmits<{
  action: [event: Event];
}>();

const badges = computed(() =>
  props.item?.badge ? castArray(props.item.badge) : []
);

const secondaryBadges = computed(() =>
  props.item?.secondaryBadge ? castArray(props.item.secondaryBadge) : []
);

const meta = computed(() => ({
  size: props.size
}));

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
