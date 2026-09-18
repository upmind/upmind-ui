<template>
  <Shell>
    <ShellSkipLink label="Skip to content" />

    <ShellHeader :class="LOGGED_OUT_HEADER_CLASS">
      <PortalBrand :label="brandName" to="/login" />
      <Button
        v-if="store"
        variant="outline"
        size="sm"
        :as="store.as"
        :to="store.to"
        :href="store.href"
        data-test-key="logged-out-store"
      >
        <ShoppingBasket />
        Place new order
      </Button>
    </ShellHeader>

    <ShellMain>
      <slot />
    </ShellMain>

    <ShellFooter>
      <Markdown
        v-if="footerMarkdown"
        tag="div"
        :model-value="footerMarkdown"
        :class="PORTAL_FOOTER_PROSE_CLASS"
      />
      <a
        v-if="hasUpmindBranding"
        :class="PORTAL_FOOTER_LINK_CLASS"
        href="https://upmind.com"
        target="_blank"
        rel="noreferrer"
        >Powered by Upmind</a
      >
    </ShellFooter>
  </Shell>
</template>

<script setup lang="ts">
// -----------------------------------------------------------------------------
/**
 * @module portal/auth/PortalAuthShell
 * @description The chrome every auth page of this app draws: the wordmark row,
 * the brand's note for the screen, and the quiet footer. The page BODY is not
 * here — each of the seven templates beside it draws its own, on the same `Page`
 * grammar the cart's layouts use, so a brand's chosen arrangement looks the
 * same in both apps.
 */
import {
  Button,
  Markdown,
  Shell,
  ShellFooter,
  ShellHeader,
  ShellMain,
  ShellSkipLink
} from "@upmind/ui";
import { ShoppingBasket } from "lucide-vue-next";
import { computed } from "vue";
import { NuxtLink } from "#components";
import { useMockBrandGates } from "~/portal/mock/gates";
import PortalBrand from "~/portal/modules/brand/Brand.vue";
import {
  LOGGED_OUT_HEADER_CLASS,
  PORTAL_FOOTER_LINK_CLASS,
  PORTAL_FOOTER_PROSE_CLASS
} from "~/portal/shell/variants";

const { brandName, footerMarkdown, hasUpmindBranding, storeShortcut } =
  useMockBrandGates();

/** The header's cart shortcut, as the primitive's polymorphic `as` needs it. */
const store = computed(() => {
  const shortcut = storeShortcut.value;
  if (shortcut === undefined) return undefined;
  if ("href" in shortcut) {
    return { as: "a", href: shortcut.href, to: undefined };
  }
  return { as: NuxtLink, href: undefined, to: shortcut.to };
});
</script>
