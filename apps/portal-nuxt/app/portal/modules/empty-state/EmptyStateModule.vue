<template>
  <EmptyState
    :title="props.title"
    :description="props.description"
    :ui="EMPTY_STATE_UI"
  >
    <template #icon>
      <component :is="props.icon ?? Inbox" />
    </template>
  </EmptyState>
</template>

<script setup lang="ts">
// -----------------------------------------------------------------------------
/**
 * @module portal/modules/empty-state/EmptyStateModule
 * @description The `empty-state` module (tasks.md 5.3, `content`-tagged) —
 * a standalone empty placeholder, over `@upmind/ui`'s `EmptyState`. Title and
 * description are config-owned data (`ModuleRef.props`), never hardcoded
 * here.
 */
import { EmptyState } from "@upmind/ui";
import { Inbox } from "lucide-vue-next";
import { EMPTY_STATE_UI } from "../../variants";
import type { EmptyStateModuleProps } from "./types";

defineOptions({ name: "PortalEmptyState" });

const props = defineProps<EmptyStateModuleProps>();
</script>
