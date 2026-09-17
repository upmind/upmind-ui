<template>
  <div />
</template>

<script setup lang="ts">
// Signing out is a VERB, not a screen: the page hands it to the one action
// door and the receipt does the rest — the ribbon comes down, the toast says
// so, and the destination is the sign-in screen. Rendered empty, exactly as
// the support pillar's own redirect page is.
import { useMockActionRunner } from "~/composables/useMockActionRunner";
import { usePortalConfig } from "~/composables/usePortalConfig";
import { MOCK_ACTION } from "~/portal/mock/actions";
import { isMockDatasetId, useMockData } from "~/portal/mock/store";

definePageMeta({ layout: "logged-out" });

const { activeDatasetId } = usePortalConfig();

const { run: runMockAction } = useMockActionRunner(
  () => {
    const id = activeDatasetId.value;
    if (!isMockDatasetId(id)) return undefined;
    return useMockData(id);
  },
  () => ({})
);

void runMockAction(MOCK_ACTION.AUTH_LOGOUT);
</script>
