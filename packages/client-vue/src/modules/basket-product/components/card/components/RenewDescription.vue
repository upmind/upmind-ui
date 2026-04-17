<template>
  <div>
    <p class="text-faint text-sm">
      {{
        t("term.renews_msg", {
          n: props.cycle,
          cycle: parseBillingCycle(props.cycle!).descriptive
        })
      }}.
    </p>

    <p
      v-if="props.discounted && !props.oneoff && !props.freeTrial"
      class="text-faint text-sm"
    >
      {{ t("term.renews_usually_msg", { price: props.regularPrice }) }}.
    </p>

    <p
      v-else-if="props.freeTrial && !props.oneoff && props.renewalPrice"
      class="text-faint text-sm"
    >
      {{ t("term.renews_usually_msg", { price: props.renewalPrice }) }}.
    </p>
  </div>
</template>

<script lang="ts" setup>
// --- external
import { useI18n } from "vue-i18n";

// --- internal
import { parseBillingCycle } from "@upmind-automation/headless";

// --- types
import type { RenewDescriptionProps } from "./types";

// -----------------------------------------------------------------------------

const { t } = useI18n();

const props = defineProps<RenewDescriptionProps>();
</script>
