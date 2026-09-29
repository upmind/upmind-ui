<template>
  <div data-test-key="contract-product-upgrade-overlay">
    <Interstitial
      :close-label="t('action.close')"
      :title="t('labs.upgrade_pending')"
      :text="t('labs.upgrade_pending_text')"
    >
      <template #icon><Icon icon="box" /></template>
    </Interstitial>
  </div>
</template>

<script lang="ts" setup>
// -----------------------------------------------------------------------------
/**
 * @module scenarios/overlay-upgrade/overlay-upgrade.page
 * @description The upgrade OVERLAY — the surface `?init=upgrade` opens over the
 * contract-product page, injected as `<parent>--upgrade`.
 *
 * STUB until CT-1 (FE-3029) + CT-2 (FE-3206). Legacy opened
 * `openAvailableMigrationsModal()` here (`cProdProvider.vue:940-947`); the
 * migrations it lists come from the contracts module CT-1 has not built. The
 * ROUTE, the injection and the intent that reaches it are real — only the
 * content stands in.
 *
 * Dismissable: nothing is in flight, so the client may simply close it.
 */

import { Interstitial } from "@upmind/ui";
import { useI18n } from "vue-i18n";
import { OverlayType } from "@upmind-automation/client-vue";
import { Icon } from "@upmind-automation/foundation";
import { ROUTE } from "~/funnels/types";

// -----------------------------------------------------------------------------

definePageMeta({
  name: ROUTE.OVERLAY_UPGRADE,
  overlay: OverlayType.MODAL,
  dismissable: true
});

const { t } = useI18n();
</script>
