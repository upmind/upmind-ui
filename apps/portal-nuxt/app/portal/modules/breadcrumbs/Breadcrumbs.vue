<template>
  <EmptyState
    v-if="meta.isEmpty"
    :title="props.emptyTitle"
    :description="props.emptyDescription"
  />
  <Breadcrumb
    v-else
    :items="[...props.items]"
    :more-label="props.moreLabel"
    :separator="props.separator"
  />
</template>

<script setup lang="ts">
// -----------------------------------------------------------------------------
/**
 * @module portal/modules/breadcrumbs/Breadcrumbs
 * @description The `breadcrumbs` module (tasks.md 5.1, `nav`-tagged) — the
 * page's trail, over `@upmind/ui`'s `Breadcrumb`. Items are config-owned data
 * (`ModuleRef.props`), never hardcoded here.
 */
import { Breadcrumb, EmptyState } from "@upmind/ui";
import { computed } from "vue";
import type { BreadcrumbsModuleProps } from "./types";

defineOptions({ name: "PortalBreadcrumbs" });

const props = defineProps<BreadcrumbsModuleProps>();

const meta = computed(() => ({ isEmpty: props.items.length === 0 }));
</script>
