<template>
  <EmptyState
    v-if="meta.isEmpty"
    :title="props.emptyTitle"
    :description="props.emptyDescription"
  />

  <div v-else :class="SPEC_ROOT_CLASS">
    <DescriptionList
      :items="meta.rows"
      align="between"
      dividers
      size="sm"
      :actions="meta.hasControls"
      :ui="{ term: meta.termClass }"
      :data-attrs="{ 'data-test-key': 'portal-spec' }"
    >
      <template #description="{ index }">
        <NuxtLink
          v-if="itemAt(index)?.to"
          :to="itemAt(index)?.to"
          class="hover:underline"
          >{{ valueFor(itemAt(index)) }}</NuxtLink
        >
        <span v-else :class="secretValueClass(itemAt(index))">{{
          valueFor(itemAt(index))
        }}</span>
        <StatusBadge
          v-if="itemAt(index)?.tag"
          class="ms-2"
          :tone="itemAt(index)?.tag?.tone"
          :dot="false"
          >{{ itemAt(index)?.tag?.label }}</StatusBadge
        >
      </template>

      <template v-if="meta.hasControls" #actions="{ index }">
        <span :class="SPEC_CONTROLS_CLASS">
          <Button
            v-if="itemAt(index)?.secret"
            size="xs"
            variant="ghost"
            icon-only
            :aria-label="props.revealLabel"
            @click="toggleReveal(itemAt(index))"
          >
            <EyeOff v-if="isRevealed(itemAt(index))" />
            <Eye v-else />
          </Button>
          <Button
            v-if="isCopyable(itemAt(index))"
            size="xs"
            variant="ghost"
            icon-only
            :aria-label="props.copyLabel"
            @click="onCopy(itemAt(index))"
          >
            <Copy />
          </Button>
        </span>
      </template>
    </DescriptionList>

    <Button
      v-if="meta.hasMore"
      variant="link"
      size="sm"
      type="button"
      :class="SPEC_MORE_CLASS"
      :aria-expanded="isExpanded"
      @click="isExpanded = !isExpanded"
    >
      {{ meta.moreLabel }}
    </Button>
  </div>
</template>

<script setup lang="ts">
// -----------------------------------------------------------------------------
/**
 * @module portal/modules/spec/Spec
 * @description The `spec` module — labelled term/value rows over the composed
 * `DescriptionList`, whose `align="between"` is exactly the spec-sheet look
 * the references draw (`CLASSES ATTENDED … 18`). Renders; it does not decide.
 *
 * A row may be a SECRET (masked until revealed) or copyable; the value stays
 * the row's own `value`, and copying goes out through `select` so the
 * dispatcher owns the clipboard, exactly as every other control does.
 */
import { Button, DescriptionList, EmptyState, StatusBadge } from "@upmind/ui";
import { Copy, Eye, EyeOff } from "lucide-vue-next";
import { computed, ref } from "vue";
import { MOCK_ACTION, mockActionValue } from "../../mock/actions";
import {
  SPEC_CONTROLS_CLASS,
  SPEC_MORE_CLASS,
  SPEC_ROOT_CLASS,
  SPEC_SECRET_MASK,
  SPEC_VALUE_CLASS,
  specTermClass
} from "./variants";
import { includes, map, size, some, take, without } from "lodash-es";
import type { SpecModuleEmits, SpecModuleItem, SpecModuleProps } from "./types";

defineOptions({ name: "PortalSpec" });

const props = defineProps<SpecModuleProps>();
const emits = defineEmits<SpecModuleEmits>();

/** `DescriptionList` scopes its slots with the ROW it built, so the module's own item comes back by position. */
function itemAt(index: number): SpecModuleItem | undefined {
  return showingItems()[index];
}

function isCopyable(item: SpecModuleItem | undefined): boolean {
  return item?.copyable === true || item?.secret === true;
}

/** Which secrets the reader has asked to see — view state, held for this mount only. */
const revealed = ref<readonly string[]>([]);

/** Whether the rows beyond `maxItems` are showing — view state, like the reveals above. */
const isExpanded = ref(false);

/** The rows on screen: capped until the reader asks for the rest. */
function showingItems(): readonly SpecModuleItem[] {
  if (props.maxItems === undefined) return props.items;
  if (isExpanded.value) return props.items;
  return take(props.items, props.maxItems);
}

function isRevealed(item: SpecModuleItem | undefined): boolean {
  if (item === undefined) return false;
  return includes(revealed.value, item.id);
}

function toggleReveal(item: SpecModuleItem | undefined): void {
  if (item === undefined) return;
  if (isRevealed(item)) {
    revealed.value = without(revealed.value, item.id);
    return;
  }
  revealed.value = [...revealed.value, item.id];
}

function valueFor(item: SpecModuleItem | undefined): string | undefined {
  if (item === undefined) return undefined;
  if (!item.secret) return item.value;
  if (isRevealed(item)) return item.value;
  return SPEC_SECRET_MASK;
}

/** A revealed secret is a value to read exactly; ordinary prose is not. */
function secretValueClass(
  item: SpecModuleItem | undefined
): string | undefined {
  if (item?.secret !== true) return undefined;
  return SPEC_VALUE_CLASS;
}

function onCopy(item: SpecModuleItem | undefined): void {
  if (item === undefined) return;
  emits("select", mockActionValue(MOCK_ACTION.COPY, item.value));
}

const meta = computed(() => {
  const showing = showingItems();
  const hasMore =
    props.maxItems !== undefined && size(props.items) > props.maxItems;
  let moreLabel = props.moreLabel;
  if (isExpanded.value) moreLabel = props.lessLabel;
  return {
    isEmpty: props.items.length === 0,
    termClass: specTermClass(props.variant),
    hasMore,
    moreLabel,
    // The action column is reserved from the ROWS: reserving it always would
    // indent every plain spec sheet in the app by a column it never fills.
    hasControls: some(
      showing,
      item => isCopyable(item) || item.secret === true
    ),
    rows: map(showing, item => ({
      term: item.label,
      description: item.value,
      numeric: true,
      dataAttrs: {
        "data-test-key": "portal-spec-item",
        "data-test-value": item.id
      }
    }))
  };
});
</script>
