<template>
  <EmptyState
    v-if="meta.isEmpty"
    :title="props.emptyTitle"
    :description="props.emptyDescription"
    :ui="EMPTY_STATE_UI"
  />

  <Timeline
    v-else
    :items="meta.events"
    :data-attrs="{ 'data-test-key': 'portal-timeline' }"
  >
    <template #event="{ event }">
      <TimelineTime v-if="event.time" :datetime="event.datetime">
        {{ event.time }}
      </TimelineTime>
      <TimelineTitle v-if="event.title">
        <NuxtLink
          v-if="event.to"
          :to="event.to"
          :class="TIMELINE_LINK_CLASS"
          v-bind="useTestAttrs({ key: 'portal-timeline-link' })"
          >{{ event.title }}</NuxtLink
        >
        <template v-else>{{ event.title }}</template>
      </TimelineTitle>
      <TimelineDescription v-if="event.description">
        {{ event.description }}
      </TimelineDescription>
    </template>
  </Timeline>
</template>

<script setup lang="ts">
// -----------------------------------------------------------------------------
/**
 * @module portal/modules/timeline/Timeline
 * @description The `timeline` module — a feed of dated events over
 * `@upmind/ui`'s `Timeline`. Renders what it is given: the events' order is
 * the caller's, and how each one READS is the tone the caller chose.
 */
import {
  EmptyState,
  Timeline,
  TimelineDescription,
  TimelineTime,
  TimelineTitle,
  useTestAttrs
} from "@upmind/ui";
import { computed } from "vue";
import { EMPTY_STATE_UI } from "../../variants";
import { TIMELINE_LINK_CLASS } from "./variants";
import { map } from "lodash-es";
import type { TimelineModuleProps } from "./types";
import type { TimelineEvent } from "@upmind/ui";
import { NuxtLink } from "#components";

/** The library's event, plus where this one leads. */
type PortalTimelineEvent = TimelineEvent & { readonly to?: string };

defineOptions({ name: "PortalTimeline" });

const props = defineProps<TimelineModuleProps>();

const meta = computed(() => ({
  isEmpty: props.items.length === 0,
  events: map(
    props.items,
    (item): PortalTimelineEvent => ({
      title: item.title,
      description: item.description,
      // The mock's dates are already display-ready, so the label IS the
      // machine value — no second field to keep in step with it.
      time: item.datetime,
      datetime: item.datetime,
      intent: item.tone,
      to: item.to,
      dataAttrs: {
        "data-test-key": "portal-timeline-item",
        "data-test-value": item.id
      }
    })
  )
}));
</script>
