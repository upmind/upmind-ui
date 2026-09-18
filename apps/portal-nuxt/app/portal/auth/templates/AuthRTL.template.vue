<template>
  <PortalAuthShell>
    <Page width="wide">
      <PageHeader v-if="$slots.hero">
        <slot name="hero" />
      </PageHeader>

      <PageBody aside="left">
        <PageAside ariaLabel="Summary">
          <slot name="summary" />
        </PageAside>

        <slot name="form" />
      </PageBody>
    </Page>
  </PortalAuthShell>
</template>

<script setup lang="ts">
// Two columns, the aside leading — what develop's `SessionRTL.template.vue`
// draws on the cart's TWO_COLUMN_RTL layout: a fluid form column beside a fixed
// aside, both stacked below `lg`. `Page`'s own `aside="left"` is that grid.
// The cart places no markdown here, so this template places no note.
import { Page, PageAside, PageBody, PageHeader } from "@upmind/ui";
import PortalAuthShell from "../PortalAuthShell.vue";
import type { AuthRoutes } from "@upmind-automation/auth";

defineProps<AuthRoutes>();

defineOptions({ inheritAttrs: false });
</script>
