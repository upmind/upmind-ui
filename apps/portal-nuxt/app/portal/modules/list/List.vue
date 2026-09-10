<template>
  <!-- Centered with a bare glyph and small muted text (EMPTY_STATE_UI) —
       the library default is a first-run hero and shouted inside a panel. -->
  <EmptyState
    v-if="meta.isEmpty"
    :title="props.emptyTitle"
    :description="props.emptyDescription"
    :ui="EMPTY_STATE_UI"
  >
    <template #icon>
      <component :is="props.emptyIcon ?? Inbox" />
    </template>
    <template v-if="props.emptyAction" #actions>
      <PortalButton size="sm" @click="onAction(props.emptyAction.value)">{{
        props.emptyAction.label
      }}</PortalButton>
    </template>
  </EmptyState>

  <ListRoot
    v-else-if="meta.isStack"
    :divided="meta.isDivided"
    :class="meta.rootClass"
    v-bind="useTestAttrs({ key: 'portal-list' })"
  >
    <template v-for="item in visibleItems" :key="item.id">
      <!-- The group's own header: one per run of rows sharing a category,
           carrying the collapse control for the rows under it. -->
      <ListItem
        v-if="startsGroup(item)"
        :class="GROUP_HEADER_CLASS"
        v-bind="
          useTestAttrs({ key: 'portal-list-group', value: item.category })
        "
      >
        <button
          type="button"
          :class="GROUP_TOGGLE_CLASS"
          :aria-expanded="!isCollapsed(item.category)"
          @click="toggleGroup(item.category)"
        >
          <ChevronDown v-if="!isCollapsed(item.category)" class="size-4" />
          <ChevronRight v-else class="size-4" />
          {{ item.category }}
        </button>
      </ListItem>
      <ListItem
        v-if="showsRow(item)"
        :class="STACK_ITEM_CLASS"
        v-bind="useTestAttrs({ key: 'portal-list-item', value: item.id })"
      >
        <template v-if="item.leadingIcon || item.leadingImageSrc" #leading>
          <IconTile v-if="item.leadingIcon"
            ><component :is="item.leadingIcon"
          /></IconTile>
          <Avatar
            v-else
            :src="item.leadingImageSrc"
            :alt="item.leadingImageAlt ?? ''"
          />
        </template>
        <!-- Above the title, not inside it: the title truncates, and a
             category the length of "Jonah Reyes · 2026-07-11" would leave it
             two letters on a phone. -->
        <StatusBadge
          v-if="item.category && !props.grouped"
          variant="secondary"
          :dot="false"
          :class="STACK_CATEGORY_CLASS"
          >{{ item.category }}</StatusBadge
        >
        <ListItemTitle>
          <NuxtLink v-if="item.to" :to="item.to" class="hover:underline">{{
            item.title
          }}</NuxtLink>
          <template v-else>{{ item.title }}</template>
        </ListItemTitle>
        <ListItemDescription
          v-if="item.description"
          :class="item.secret ? SECRET_DESCRIPTION_CLASS : undefined"
        >
          <span :class="['truncate', secretValueClass(item)]">{{
            descriptionFor(item)
          }}</span>
          <span v-if="item.secret" :class="ROW_CONTROLS_CLASS">
            <PortalButton
              size="xs"
              variant="ghost"
              icon-only
              :aria-label="props.revealLabel"
              @click="toggleReveal(item)"
            >
              <EyeOff v-if="isRevealed(item)" />
              <Eye v-else />
            </PortalButton>
            <PortalButton
              size="xs"
              variant="ghost"
              icon-only
              :aria-label="props.copyLabel"
              @click="onAction(copyValue(item))"
            >
              <Copy />
            </PortalButton>
          </span>
        </ListItemDescription>
        <template v-if="hasTrailing(item)" #trailing>
          <div :class="STACK_TRAILING_CLASS">
            <component
              :is="tag.action ? 'button' : 'span'"
              v-for="tag in item.tags"
              :key="tag.label"
              :type="tag.action ? 'button' : undefined"
              :aria-label="tag.action?.label"
              @click="tag.action && onAction(tag.action.value)"
            >
              <StatusBadge :tone="tag.tone" :dot="false">{{
                tag.label
              }}</StatusBadge>
            </component>
            <StatusBadge
              v-if="badgeFor(item)"
              :tone="badgeFor(item)?.tone"
              :dot="false"
              >{{ badgeFor(item)?.label }}</StatusBadge
            >
            <Switch
              v-if="item.toggle"
              :model-value="item.toggle.checked"
              :aria-label="item.toggle.label"
              :disabled="item.toggle.disabledReason !== undefined"
              :title="item.toggle.disabledReason"
              @update:model-value="onAction(item.toggle.value)"
            />
            <!-- Outline + xs, like every other list variant's action: a row's
               action is never the page's bold primary CTA. -->
            <PortalButton
              v-if="item.action"
              size="xs"
              variant="outline"
              @click="onAction(item.action.value)"
              >{{ item.action.label }}</PortalButton
            >
            <DropdownMenu
              v-if="item.moreActions?.length"
              :items="moreMenuItems(item.moreActions)"
            >
              <template #trigger>
                <PortalButton
                  size="xs"
                  variant="ghost"
                  icon-only
                  :aria-label="props.moreLabel"
                >
                  <Ellipsis />
                </PortalButton>
              </template>
            </DropdownMenu>
          </div>
        </template>
      </ListItem>
    </template>
  </ListRoot>

  <div
    v-else-if="meta.isRowCards"
    :class="ROW_CARDS_ROOT_CLASS"
    v-bind="useTestAttrs({ key: 'portal-list' })"
  >
    <div
      v-for="item in visibleItems"
      :key="item.id"
      :class="ROW_CARD_CLASS"
      v-bind="useTestAttrs({ key: 'portal-list-item', value: item.id })"
    >
      <span
        class="bg-neutral-muted rounded-button grid size-11 shrink-0 place-items-center overflow-hidden"
      >
        <img
          v-if="item.leadingImageSrc"
          :src="item.leadingImageSrc"
          :alt="item.leadingImageAlt ?? ''"
          class="size-full object-cover"
        />
        <component
          :is="item.leadingIcon"
          v-else-if="item.leadingIcon"
          class="text-muted size-5"
        />
      </span>
      <div class="min-w-0 flex-1">
        <p class="text-display truncate font-medium">
          <NuxtLink v-if="item.to" :to="item.to" class="hover:underline">{{
            item.title
          }}</NuxtLink>
          <template v-else>{{ item.title }}</template>
        </p>
        <p v-if="item.description" class="text-muted flex gap-1 text-sm">
          <span class="truncate" :class="secretValueClass(item)">{{
            descriptionFor(item)
          }}</span>
          <span v-if="item.secret" :class="ROW_CONTROLS_CLASS">
            <PortalButton
              size="xs"
              variant="ghost"
              icon-only
              :aria-label="props.revealLabel"
              @click="toggleReveal(item)"
            >
              <EyeOff v-if="isRevealed(item)" />
              <Eye v-else />
            </PortalButton>
            <PortalButton
              size="xs"
              variant="ghost"
              icon-only
              :aria-label="props.copyLabel"
              @click="onAction(copyValue(item))"
            >
              <Copy />
            </PortalButton>
          </span>
        </p>
      </div>
      <div :class="ROW_CARD_TRAILING_CLASS">
        <component
          :is="tag.action ? 'button' : 'span'"
          v-for="tag in item.tags"
          :key="tag.label"
          :type="tag.action ? 'button' : undefined"
          :aria-label="tag.action?.label"
          @click="tag.action && onAction(tag.action.value)"
        >
          <StatusBadge :tone="tag.tone" :dot="false">{{
            tag.label
          }}</StatusBadge>
        </component>
        <StatusBadge
          v-if="badgeFor(item)"
          :tone="badgeFor(item)?.tone"
          :dot="false"
          >{{ badgeFor(item)?.label }}</StatusBadge
        >
        <Switch
          v-if="item.toggle"
          :model-value="item.toggle.checked"
          :aria-label="item.toggle.label"
          :disabled="item.toggle.disabledReason !== undefined"
          :title="item.toggle.disabledReason"
          @update:model-value="onAction(item.toggle.value)"
        />
        <PortalButton
          v-if="item.action"
          size="sm"
          variant="outline"
          @click="onAction(item.action.value)"
          >{{ item.action.label }}</PortalButton
        >
        <DropdownMenu
          v-if="item.moreActions?.length"
          :items="moreMenuItems(item.moreActions)"
        >
          <template #trigger>
            <PortalButton
              size="sm"
              variant="ghost"
              icon-only
              :aria-label="props.moreLabel"
            >
              <Ellipsis />
            </PortalButton>
          </template>
        </DropdownMenu>
      </div>
    </div>
  </div>

  <div v-else-if="meta.isCards" :class="meta.gridClass">
    <CardRoot
      v-for="item in visibleItems"
      :key="item.id"
      class="flex flex-col overflow-hidden"
      v-bind="useTestAttrs({ key: 'portal-list-item', value: item.id })"
    >
      <!-- Media above the header. The composed `Card` renders its header
           first and exposes no media slot (ui-gaps.md), so this is the one
           place the parts are reached for rather than the composed form. -->
      <div :class="['bg-neutral-muted w-full shrink-0', meta.mediaClass]">
        <img
          v-if="item.leadingImageSrc"
          :src="item.leadingImageSrc"
          :alt="item.leadingImageAlt ?? ''"
          class="size-full object-cover"
        />
        <span v-else class="text-muted grid size-full place-items-center">
          <component
            :is="item.leadingIcon"
            v-if="item.leadingIcon"
            class="size-8"
          />
        </span>
      </div>

      <CardHeader class="p-4 pb-2">
        <!-- One line above the title for both badges, not the header's action
             corner: a corner badge as long as "£19.00 · Monthly" takes its
             column off the title, which then breaks one word to a line. -->
        <div
          v-if="item.category || badgeFor(item)"
          :class="CARD_BADGE_ROW_CLASS"
        >
          <StatusBadge v-if="item.category" variant="secondary" :dot="false">{{
            item.category
          }}</StatusBadge>
          <StatusBadge
            v-if="badgeFor(item)"
            class="ms-auto"
            :tone="badgeFor(item)?.tone"
            :dot="false"
            >{{ badgeFor(item)?.label }}</StatusBadge
          >
        </div>
        <CardTitle class="text-sm">
          <NuxtLink v-if="item.to" :to="item.to" class="hover:underline">{{
            item.title
          }}</NuxtLink>
          <template v-else>{{ item.title }}</template>
        </CardTitle>
        <CardDescription v-if="item.description" class="text-xs">{{
          item.description
        }}</CardDescription>
      </CardHeader>

      <CardFooter v-if="item.action" class="mt-auto gap-2 p-4 pt-2">
        <PortalButton
          size="sm"
          variant="outline"
          :class="item.secondaryAction ? undefined : 'w-full'"
          @click="onAction(item.action.value)"
          >{{ item.action.label }}</PortalButton
        >
        <PortalButton
          v-if="item.secondaryAction"
          size="sm"
          variant="ghost"
          @click="onAction(item.secondaryAction.value)"
          >{{ item.secondaryAction.label }}</PortalButton
        >
      </CardFooter>
    </CardRoot>
  </div>

  <div v-else-if="meta.isTable" :class="TABLE_ROOT_CLASS">
    <Table>
      <TableHeader v-if="meta.hasHeadings">
        <TableRow>
          <TableHead
            v-for="heading in props.headings"
            :key="heading.label"
            :numeric="heading.numeric"
            >{{ heading.label }}</TableHead
          >
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow
          v-for="item in visibleItems"
          :key="item.id"
          v-bind="useTestAttrs({ key: 'portal-list-item', value: item.id })"
        >
          <TableCell :class="TABLE_CELL_CLASS">
            <div class="flex items-center gap-3">
              <IconTile v-if="item.leadingIcon" size="sm"
                ><component :is="item.leadingIcon"
              /></IconTile>
              <Avatar
                v-else-if="item.leadingImageSrc"
                size="sm"
                :src="item.leadingImageSrc"
                :alt="item.leadingImageAlt ?? ''"
              />
              <span class="text-display font-medium">
                <NuxtLink
                  v-if="item.to"
                  :to="item.to"
                  class="hover:underline"
                  >{{ item.title }}</NuxtLink
                >
                <template v-else>{{ item.title }}</template>
              </span>
            </div>
          </TableCell>
          <TableCell
            v-for="(cell, index) in rowCells(item)"
            :key="index"
            :numeric="cell.numeric"
            :class="['text-muted', TABLE_CELL_CLASS]"
            >{{ cell.value }}</TableCell
          >
          <TableCell v-if="meta.hasTrailing" class="text-right">
            <span class="inline-flex items-center gap-1">
              <component
                :is="tag.action ? 'button' : 'span'"
                v-for="tag in item.tags"
                :key="tag.label"
                :type="tag.action ? 'button' : undefined"
                :aria-label="tag.action?.label"
                @click="tag.action && onAction(tag.action.value)"
              >
                <StatusBadge :tone="tag.tone" :dot="false">{{
                  tag.label
                }}</StatusBadge>
              </component>
              <StatusBadge
                v-if="badgeFor(item)"
                :tone="badgeFor(item)?.tone"
                :dot="false"
                >{{ badgeFor(item)?.label }}</StatusBadge
              >
            </span>
          </TableCell>
          <TableCell v-if="meta.hasRowActions" class="text-right">
            <span class="inline-flex items-center gap-1">
              <PortalButton
                v-if="item.action"
                variant="outline"
                size="sm"
                @click="onAction(item.action.value)"
                >{{ item.action.label }}</PortalButton
              >
              <DropdownMenu
                v-if="item.moreActions?.length"
                :items="moreMenuItems(item.moreActions)"
              >
                <template #trigger>
                  <PortalButton
                    size="sm"
                    variant="ghost"
                    icon-only
                    :aria-label="props.moreLabel"
                  >
                    <Ellipsis />
                  </PortalButton>
                </template>
              </DropdownMenu>
            </span>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>

  <Timeline v-else :items="timelineEvents">
    <template #marker="{ event }">
      <component :is="event.leadingIcon" v-if="event.leadingIcon" />
      <TimelineDot v-else />
    </template>
    <template #event="{ event }">
      <div :class="TIMELINE_EVENT_HEAD_CLASS">
        <TimelineTime v-if="event.time" :datetime="event.datetime">{{
          event.time
        }}</TimelineTime>
        <!-- The row's own menu, where it carries one: legacy hung the edit and
             delete controls off the message itself, not off the thread. -->
        <DropdownMenu
          v-if="event.moreActions?.length"
          :items="moreMenuItems(event.moreActions)"
        >
          <template #trigger>
            <PortalButton
              size="xs"
              variant="ghost"
              icon-only
              :aria-label="props.moreLabel"
            >
              <Ellipsis />
            </PortalButton>
          </template>
        </DropdownMenu>
      </div>
      <!-- A row continuing the run above it keeps the title the run already
           carries, so the thread reads as one voice rather than a repeated name. -->
      <TimelineTitle v-if="!event.groupWithPrevious">{{
        event.title
      }}</TimelineTitle>
      <TimelineDescription v-if="event.description">{{
        event.description
      }}</TimelineDescription>
      <StatusBadge
        v-if="event.trailingText"
        class="mt-1"
        :tone="event.trailingTone"
        :dot="false"
        >{{ event.trailingText }}</StatusBadge
      >
    </template>
  </Timeline>

  <PortalButton
    v-if="meta.showMoreLabel"
    size="sm"
    variant="ghost"
    :aria-expanded="isExpanded"
    @click="isExpanded = !isExpanded"
    >{{ meta.showMoreLabel }}</PortalButton
  >
</template>

<script setup lang="ts">
// -----------------------------------------------------------------------------
/**
 * @module portal/modules/list/List
 * @description The `list` module (tasks.md 5.5, `content`-tagged) — its
 * `compact`, `table`, `masonry` and `timeline` variants, one component
 * rendering the SAME generic item shape (tasks.md 5.8, AC6.6) four ways.
 * `compact`/`masonry` hand-assemble `ListRoot`/`ListItem` directly rather
 * than the composed `List` — the composed form exposes only `item`/`trailing`
 * slots (`design-system/packages/ui/src/components/list/List.vue`), with no
 * way to reach `ListItem`'s own `#leading` slot, so it cannot carry the
 * leading visual AC6.6 requires (ui-gaps.md).
 *
 * `masonry`'s multi-column flow is the MODULE's (variants.ts): `ListRoot`
 * carries no `layout` variant on this submodule branch, and its column count
 * always keyed off the viewport rather than the call site's own container
 * width, which `columns` narrows (ui-gaps.md).
 */
import {
  Avatar,
  Button as PortalButton,
  Switch,
  CardDescription,
  CardFooter,
  CardHeader,
  CardRoot,
  CardTitle,
  DropdownMenu,
  EmptyState,
  IconTile,
  ListItem,
  ListItemDescription,
  ListItemTitle,
  ListRoot,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Timeline,
  TimelineDescription,
  TimelineDot,
  TimelineTime,
  TimelineTitle,
  useTestAttrs
} from "@upmind/ui";
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Ellipsis,
  Eye,
  EyeOff,
  Inbox
} from "lucide-vue-next";
import { computed, ref } from "vue";
import { MOCK_ACTION, mockActionValue } from "../../mock/actions";
import { EMPTY_STATE_UI } from "../../variants";
import { LIST_MODULE_VARIANT } from "./types";
import {
  CARD_BADGE_ROW_CLASS,
  CARD_CAROUSEL_CLASS,
  GROUP_HEADER_CLASS,
  GROUP_TOGGLE_CLASS,
  ROW_CARDS_ROOT_CLASS,
  ROW_CARD_CLASS,
  ROW_CARD_TRAILING_CLASS,
  ROW_CONTROLS_CLASS,
  SECRET_DESCRIPTION_CLASS,
  SECRET_MASK,
  SECRET_VALUE_CLASS,
  STACK_CATEGORY_CLASS,
  STACK_ITEM_CLASS,
  STACK_ROOT_CLASS,
  STACK_TRAILING_CLASS,
  TABLE_CELL_CLASS,
  TABLE_ROOT_CLASS,
  TIMELINE_EVENT_HEAD_CLASS,
  cardGridClass,
  cardMediaClass,
  masonryClass
} from "./variants";
import {
  compact as compacted,
  findIndex,
  includes,
  map,
  size,
  some,
  take,
  without
} from "lodash-es";
import type {
  ListModuleCell,
  ListModuleEmits,
  ListModuleItem,
  ListModuleProps
} from "./types";
import type { BadgeVariants, MenuItem } from "@upmind/ui";
import { NuxtLink } from "#components";

defineOptions({ name: "PortalList" });

const props = defineProps<ListModuleProps>();
const emits = defineEmits<ListModuleEmits>();

function onAction(value: string) {
  emits("select", value);
}

/**
 * The row's trailing badge. `status` is the named pair; `trailingText` is the
 * loose spelling every caller before it used, and both render the same chip.
 */
function badgeFor(
  item: ListModuleItem
): { label: string; tone: BadgeVariants["variant"] } | undefined {
  if (item.status !== undefined) return item.status;
  if (item.trailingText === undefined) return undefined;
  return { label: item.trailingText, tone: item.trailingTone };
}

/** Which secrets the reader has asked to see — view state, held for this mount only. */
const revealed = ref<readonly string[]>([]);

function isRevealed(item: ListModuleItem): boolean {
  return includes(revealed.value, item.id);
}

function toggleReveal(item: ListModuleItem): void {
  if (isRevealed(item)) {
    revealed.value = without(revealed.value, item.id);
    return;
  }
  revealed.value = [...revealed.value, item.id];
}

/**
 * Which groups the reader has folded away — the ONE piece of UI state this
 * module holds beyond the reveals above, because a fold is a decision about
 * the VIEW that no dataset can answer. Groups open by default.
 */
const collapsed = ref<readonly string[]>([]);

function isCollapsed(category: string | undefined): boolean {
  if (category === undefined) return false;
  return includes(collapsed.value, category);
}

function toggleGroup(category: string | undefined): void {
  if (category === undefined) return;
  if (isCollapsed(category)) {
    collapsed.value = without(collapsed.value, category);
    return;
  }
  collapsed.value = [...collapsed.value, category];
}

/** The first row of a run heads it — rows arrive already grouped, as the selector ordered them. */
function startsGroup(item: ListModuleItem): boolean {
  if (!props.grouped || item.category === undefined) return false;
  const first = findIndex(visibleItems.value, { category: item.category });
  return visibleItems.value[first]?.id === item.id;
}

/** A row under a folded group is not rendered; every other row is. */
function showsRow(item: ListModuleItem): boolean {
  if (!props.grouped) return true;
  return !isCollapsed(item.category);
}

/** Whether the rows beyond `maxItems` are showing — view state, like the reveals above. */
const isExpanded = ref(false);

/** A secret reads as bullets until it is revealed; everything else reads as itself. */
function descriptionFor(item: ListModuleItem): string | undefined {
  if (!item.secret) return item.description;
  if (isRevealed(item)) return item.description;
  return SECRET_MASK;
}

/** A revealed secret is a value to read exactly; ordinary prose is not. */
function secretValueClass(item: ListModuleItem): string | undefined {
  if (!item.secret) return undefined;
  return SECRET_VALUE_CLASS;
}

/** Copying goes through the same door every other control does — the dispatcher owns the clipboard. */
function copyValue(item: ListModuleItem): string {
  return mockActionValue(MOCK_ACTION.COPY, item.description ?? "");
}

function moreMenuItems(
  actions: NonNullable<ListModuleItem["moreActions"]>
): MenuItem[] {
  return map(actions, action => ({
    label: action.label,
    value: action.value,
    disabled: action.disabledReason !== undefined,
    onSelect: () => onAction(action.value)
  }));
}

/** Whether a stacked row has anything at all to put after its text. */
function hasTrailing(item: ListModuleItem): boolean {
  return (
    badgeFor(item) !== undefined ||
    (item.tags?.length ?? 0) > 0 ||
    item.action !== undefined ||
    item.toggle !== undefined ||
    (item.moreActions?.length ?? 0) > 0
  );
}

/** A row's middle columns; a row written before columns existed reads its description as the one cell. */
function rowCells(item: ListModuleItem): ListModuleCell[] {
  if (item.cells !== undefined) return [...item.cells];
  return compacted([item.description]).map(value => ({ value }));
}

/** The rows that render — `maxItems` caps a summary list (a dashboard's), the View-all action carrying the rest. */
const visibleItems = computed(() => {
  if (props.maxItems === undefined || isExpanded.value) return props.items;
  return take(props.items, props.maxItems);
});

/** `compact` renders the ruled stack; only `masonry` takes the column flow. Both are the query root their rows measure against. */
function stackRootClass(
  columns: ListModuleProps["columns"],
  isMasonry: boolean
): string {
  if (!isMasonry) return STACK_ROOT_CLASS;
  return `${STACK_ROOT_CLASS} ${masonryClass(columns)}`;
}

const meta = computed(() => {
  const isEmpty = props.items.length === 0;
  const isMasonry = props.variant === LIST_MODULE_VARIANT.MASONRY;
  return {
    isEmpty,
    isStack:
      !isEmpty && (props.variant === LIST_MODULE_VARIANT.COMPACT || isMasonry),
    isRowCards: !isEmpty && props.variant === LIST_MODULE_VARIANT.ROW_CARDS,
    isCards:
      !isEmpty &&
      (props.variant === LIST_MODULE_VARIANT.CARDS ||
        props.variant === LIST_MODULE_VARIANT.CAROUSEL),
    isTable: !isEmpty && props.variant === LIST_MODULE_VARIANT.TABLE,
    hasHeadings: (props.headings?.length ?? 0) > 0,
    // A column earns its place from the ROWS, not from one row: a trailing or
    // action cell on every row keeps the grid square under the headings.
    hasTrailing: some(
      props.items,
      item => badgeFor(item) !== undefined || (item.tags?.length ?? 0) > 0
    ),
    hasRowActions: some(
      props.items,
      item => item.action !== undefined || (item.moreActions?.length ?? 0) > 0
    ),
    gridClass:
      props.variant === LIST_MODULE_VARIANT.CAROUSEL
        ? CARD_CAROUSEL_CLASS
        : cardGridClass(props.columns),
    mediaClass: cardMediaClass(props.media),
    // A stacked list rules between its rows; a masonry one flows them into
    // columns, where a divider would draw across the gutter.
    isDivided: !isMasonry,
    rootClass: stackRootClass(props.columns, isMasonry),
    showMoreLabel: showAllLabel()
  } as const;
});

/** The Show-all control's label, or nothing where there is nothing more to show. */
function showAllLabel(): string | undefined {
  const capped =
    props.maxItems !== undefined && size(props.items) > props.maxItems;
  if (!capped) return undefined;
  if (isExpanded.value) return props.showLessLabel;
  return props.showMoreLabel;
}

const timelineEvents = computed(() =>
  map(visibleItems.value, item => ({
    title: item.title,
    description: item.description,
    time: item.time,
    datetime: item.datetime,
    leadingIcon: item.leadingIcon,
    groupWithPrevious: item.groupWithPrevious,
    moreActions: item.moreActions,
    trailingText: badgeFor(item)?.label,
    trailingTone: badgeFor(item)?.tone
  }))
);
</script>
