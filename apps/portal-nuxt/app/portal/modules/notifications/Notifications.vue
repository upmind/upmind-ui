<template>
  <Popover>
    <template #trigger>
      <span
        class="relative inline-flex"
        v-bind="useTestAttrs({ key: 'portal-notifications' })"
      >
        <PortalButton variant="ghost" icon-only :aria-label="props.label">
          <Bell />
        </PortalButton>
        <StatusBadge
          v-if="meta.hasUnread"
          class="absolute -top-1 -right-1"
          :dot="false"
          >{{ props.count }}</StatusBadge
        >
      </span>
    </template>

    <div :class="PANEL_CLASS">
      <ToggleGroup
        v-if="meta.hasFilters"
        type="single"
        :size="FILTER_RAIL_SIZE"
        :model-value="props.filterValue"
        :aria-label="props.filterLabel"
        :data-attrs="{ 'data-test-key': 'portal-notifications-filter' }"
        @update:model-value="onFilter"
      >
        <ToggleGroupItem
          v-for="option in props.filters"
          :key="option.value"
          :value="option.value"
          >{{ option.label }}</ToggleGroupItem
        >
      </ToggleGroup>

      <EmptyState v-if="meta.isEmpty" :title="props.emptyTitle" />
      <!-- The rows scroll; the rail above and the controls below do not, so
           both stay reachable however far down the feed the reader is. -->
      <div v-else ref="feed" :class="FEED_CLASS">
        <ListRoot layout="stack">
          <ListItem
            v-for="item in props.items"
            :key="item.id"
            v-bind="
              useTestAttrs({ key: 'portal-notification', value: item.id })
            "
          >
            <ListItemTitle>{{ item.title }}</ListItemTitle>
            <ListItemDescription v-if="item.description">{{
              item.description
            }}</ListItemDescription>
            <!-- A cut body carries the control that opens the whole of it;
               one that reads whole carries none. -->
            <PortalButton
              v-if="item.action"
              size="xs"
              variant="link"
              class="self-start px-0"
              @click="emits('select', item.action.value)"
              >{{ item.action.label }}</PortalButton
            >
            <!-- Without this the dropdown cannot distinguish today's alert from
               last month's: the selector dates every notification. -->
            <time
              v-if="item.time"
              :datetime="item.datetime"
              class="text-muted text-xs"
              >{{ item.time }}</time
            >
            <template
              v-if="item.trailingText || item.secondaryAction"
              #trailing
            >
              <StatusBadge v-if="item.trailingText" :dot="false">{{
                item.trailingText
              }}</StatusBadge>
              <PortalButton
                v-if="item.secondaryAction"
                size="xs"
                variant="ghost"
                icon-only
                :aria-label="props.dismissLabel"
                @click="emits('select', item.secondaryAction.value)"
              >
                <X />
              </PortalButton>
            </template>
          </ListItem>
        </ListRoot>
      </div>

      <div class="flex items-center justify-between gap-2">
        <PortalButton
          size="sm"
          variant="ghost"
          @click="emits('select', props.markReadAction)"
        >
          {{ props.markReadLabel }}
        </PortalButton>
        <NuxtLink :to="props.viewAllTo" class="text-sm hover:underline">
          {{ props.viewAllLabel }}
        </NuxtLink>
      </div>
    </div>
  </Popover>
</template>

<script setup lang="ts">
// -----------------------------------------------------------------------------
/**
 * @module portal/modules/notifications/Notifications
 * @description The `notifications` module — legacy's topbar dropdown, over
 * the composed Popover. Data-first: items, count and copy arrive as props;
 * mark-all-read rides the action seam like every other emit.
 */
import {
  Button as PortalButton,
  EmptyState,
  ListItem,
  ListItemDescription,
  ListItemTitle,
  ListRoot,
  Popover,
  StatusBadge,
  ToggleGroup,
  ToggleGroupItem,
  useTestAttrs
} from "@upmind/ui";
import { useInfiniteScroll } from "@vueuse/core";
import { Bell, X } from "lucide-vue-next";
import { computed, ref } from "vue";
import {
  FEED_CLASS,
  FEED_PAGE_DISTANCE,
  FILTER_RAIL_SIZE,
  PANEL_CLASS
} from "./variants";
import type {
  NotificationsModuleEmits,
  NotificationsModuleProps
} from "./types";
import { NuxtLink } from "#components";

defineOptions({ name: "PortalNotifications" });

const props = defineProps<NotificationsModuleProps>();
const emits = defineEmits<NotificationsModuleEmits>();

const meta = computed(() => ({
  isEmpty: props.items.length === 0,
  hasUnread: props.count > 0,
  hasFilters:
    (props.filters?.length ?? 0) > 0 && props.filterAction !== undefined
}));

const feed = ref<HTMLElement | null>(null);

/**
 * The feed pages on reaching its own end, never on a control. Legacy's
 * dropdown ACCUMULATED rows, so a "load more" button under a scroll region was
 * a second thing to find; the scroll is the affordance. `canLoadMore` reads
 * the SAME signal the button did — a feed with nothing further asks for
 * nothing — and the composable's own interval keeps one page in flight.
 */
useInfiniteScroll(
  feed,
  () => {
    if (props.loadMore === undefined) return;
    emits("select", props.loadMore.value);
  },
  {
    distance: FEED_PAGE_DISTANCE,
    canLoadMore: () => props.loadMore !== undefined
  }
);

/** A rail that clears itself reports the empty value; the seam reads that as "all". */
function onFilter(value: unknown): void {
  if (props.filterAction === undefined) return;
  emits("select", `${props.filterAction}:${String(value ?? "")}`);
}
</script>
