<template>
  <PortalAuthShell>
    <Page width="reading">
      <PageHeader v-if="$slots.hero">
        <slot name="hero" />
      </PageHeader>

      <PageBody>
        <Card :ui="{ content: LOGGED_OUT_CARD_CONTENT_CLASS }">
          <PortalAuthNote />
          <slot name="markdown" />
          <slot name="form" />
        </Card>
      </PageBody>
    </Page>
  </PortalAuthShell>
</template>

<script setup lang="ts">
// One centred box — what develop's `SessionSurfaceBox.template.vue` draws on the
// cart's SURFACE_BOX layout: a single card on the canvas, holding the marketing
// copy and the form together, with the hero above it.
import { Card, Page, PageBody, PageHeader } from "@upmind/ui";
import PortalAuthNote from "../PortalAuthNote.vue";
import PortalAuthShell from "../PortalAuthShell.vue";
import { LOGGED_OUT_CARD_CONTENT_CLASS } from "~/portal/shell/variants";
import type { AuthRoutes } from "@upmind-automation/auth";

defineProps<AuthRoutes>();

defineOptions({ inheritAttrs: false });
</script>
