<template>
  <PortalAuthShell>
    <div :class="SPLIT_ROOT_CLASS">
      <div :class="SPLIT_FORM_CLASS">
        <slot name="hero" />
        <PortalAuthNote />
        <slot name="markdown" />
        <slot name="form" />
      </div>

      <div :class="SPLIT_ASIDE_CLASS" aria-hidden="true" />
    </div>
  </PortalAuthShell>
</template>

<script setup lang="ts">
// Two equal halves — what develop's `SessionSplit.template.vue` draws on the
// cart's SPLIT_HORIZONTAL layout: a surface form half beside a plain canvas
// half, both at `md` and up. The second half carries nothing in the cart, so it
// is decorative here too.
import PortalAuthNote from "../PortalAuthNote.vue";
import PortalAuthShell from "../PortalAuthShell.vue";
import {
  SPLIT_ASIDE_CLASS,
  SPLIT_FORM_CLASS,
  SPLIT_ROOT_CLASS
} from "~/portal/shell/variants";
import type { AuthRoutes } from "@upmind-automation/auth";

defineProps<AuthRoutes>();

defineOptions({ inheritAttrs: false });
</script>
