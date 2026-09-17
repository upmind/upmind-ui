<template>
  <TooltipProvider>
    <slot />
    <Toaster />
  </TooltipProvider>
</template>

<script setup lang="ts">
// -----------------------------------------------------------------------------
/**
 * @module layouts/logged-out
 * @description The host seams the auth screens need, and nothing else. The page
 * itself comes from one of this app's seven auth templates, which the socket
 * below hands the `auth` package — the wordmark row, the narrow column and the
 * quiet footer all live in `PortalAuthShell` beside them.
 *
 * None of the signed-in chrome reaches here: no sidebar, no topbar menus, no
 * impersonation ribbon. What it DOES carry is everything a form needs — the
 * engine's two host seams (plan F7), the active dataset for the data-ref seam,
 * and the toaster every receipt lands in.
 */
import {
  Toaster,
  TooltipProvider,
  provideFormEngineData,
  provideFormIcon
} from "@upmind/ui";
import { computed, watch } from "vue";
import {
  provideShellComponents,
  provideThemeEngine
} from "@upmind-automation/foundation";
import { usePortalConfig } from "~/composables/usePortalConfig";
import { useTheme } from "~/composables/useTheme";
import { PORTAL_AUTH_SHELL_COMPONENTS } from "~/portal/auth/shell";
import { portalFormEngineData } from "~/portal/mock/forms/engine-data";
import { provideActiveMockData } from "~/portal/mock/injection";
import PortalFormIcon from "~/portal/shell/PortalFormIcon.vue";

const { activeConfig } = usePortalConfig();
const { setTheme } = useTheme();

// The pages under this layout resolve their own rows through data refs, so the
// dataset has to be above them exactly as it is above the signed-in shell.
provideActiveMockData();

// The form engine's two host seams (plan F7) — a logged-out form needs them as
// much as a signed-in one does.
provideFormIcon(PortalFormIcon);
provideFormEngineData(portalFormEngineData());

// `foundation`'s theme port, filled with this app's own applier.
provideThemeEngine({ set: setTheme });

// Every template name the `auth` package can resolve has a page here. Without
// this the package has no page to render into and says so.
provideShellComponents(computed(() => PORTAL_AUTH_SHELL_COMPONENTS));

// The shape's own brand, applied the same way the signed-in layout applies it.
watch(activeConfig, config => setTheme(config.theme ?? "upmind"), {
  immediate: true
});
</script>
