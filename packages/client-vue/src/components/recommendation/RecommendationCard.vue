<template>
  <UpmCard class="h-full w-full !p-0">
    <div class="flex h-full flex-col">
      <!-- Image section -->
      <div class="aspect-video shrink-0 overflow-hidden rounded-t-lg">
        <img
          v-if="recommendation.imgUrl"
          class="m-0 h-full w-full object-cover object-center"
          :src="recommendation.imgUrl"
          alt="Recommendation"
        />
        <div
          v-else
          class="from-promotion to-promotion-200 h-full w-full bg-gradient-to-br"
        />
      </div>

      <!-- Content section -->
      <div class="flex flex-1 flex-col gap-4 p-6 text-sm font-medium leading-6">
        <!-- Title and description -->
        <div class="flex flex-col gap-2">
          <div class="flex flex-col gap-2">
            <h3 class="text-md m-0 font-medium">
              {{ recommendation.name }}
            </h3>

            <Lineclamp
              v-if="recommendation.description"
              class="text-emphasis-medium m-0 min-h-12 text-sm leading-6"
              :lines="2"
              :labelMore="t('product.actions.more', 1)"
              :labelLess="t('product.actions.more', 0)"
            >
              {{ recommendation.description }}
            </Lineclamp>
          </div>
        </div>

        <!-- Spacer to push promotion, price and button to bottom -->
        <div class="-my-2 flex-1"></div>

        <div class="flex flex-col gap-2">
          <span
            v-for="promotion in recommendation.promotions"
            :key="promotion.id"
            class="shrink-0"
          >
            <Promotion
              :discounted="recommendation.meta.discounted"
              :currentSaving="promotion.currentSaving"
              :currentSavingAmount="promotion.currentSavingAmount"
              size="xs"
            />
          </span>

          <!-- Price section -->
          <div class="flex items-center text-xl font-bold leading-6">
            <span
              v-if="meta.free || recommendation.monthlyFromCurrentAmount === 0"
            >
              {{ t("recommendations.card.free") }}
            </span>
            <span v-else class="flex items-center">
              {{ t("recommendations.card.price.prefix") }}
              {{ recommendation.monthlyFromCurrentPrice }}
            </span>

            <s
              v-if="
                recommendation.monthlyFromCurrentAmount <
                recommendation.monthlyFromRegularAmount
              "
              class="text-emphasis-medium ml-2 text-sm"
              >{{ recommendation.monthlyFromRegularPrice }}</s
            >
          </div>
        </div>

        <!-- Button section -->
        <div>
          <Button
            color="primary"
            size="sm"
            :disabled="recommendation.added"
            :loading="resolved && !recommendation.added"
            :label="
              recommendation.added
                ? t('recommendations.card.added')
                : recommendation.label
            "
            block
            @click="doResolve(recommendation)"
          >
            <template #prepend>
              <Icon v-if="recommendation.added" icon="check" size="2xs" />
            </template>
          </Button>
        </div>
      </div>
    </div>
  </UpmCard>
</template>

<script lang="ts" setup>
import { UpmCard } from "@upmind-automation/client-vue";
import { Button, Lineclamp, Icon } from "@upmind-automation/upwind";
import { useI18n } from "vue-i18n";
import Promotion from "../basket/product/components/Promotion.vue";
import { ref } from "vue";

const { t } = useI18n();

const props = defineProps<{
  index: number;
  recommendation: any;
  meta: any;
}>();

const emit = defineEmits<{
  (e: "resolve", recommendation: any): void;
}>();

const resolved = ref(false);

const doResolve = async (recommendation: any) => {
  resolved.value = true;
  emit("resolve", recommendation);
};

const getImageUrl = () => {
  if (props.index === 0) {
    return "https://s3-alpha-sig.figma.com/img/216f/602f/2425f8e0e9b4eab995afb91006ac56cd?Expires=1734912000&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=inNDLTycZcT0mr6G9h1bfL9t0OWOFWhhUjvDeK5KPCgN8APXqW8cnmO4rqCw63qlgs9iZs4D-OKEOlEWMvsHfeDe6mms~W7Oo6-rRQID4QWTHf5wdvtybZjoapQVFljPGWpR7C2Ihg9ypOEwE6Kt~sk0bisYKpuC8nsux~7XoZHvfqcKOVUUd3l-jTrQbz69lwZrkAXnhv8JUIKQfycvwNczk3VGDSBLP1VR3Afna0~xadJKSjW0cBSIWkWx3LZrXVMCsq4Ek3cYB8UrVmMRdFlck-9S8VRBpWUblVjq3ATAiRzfndCblVJLj3VpEn94EnJJognnLWk~aCu8iQ-gIg__";
  }

  if (props.index === 1) {
    return "https://s3-alpha-sig.figma.com/img/8a9a/0a9e/23175bed04cb61dfea897a7eadbc107a?Expires=1734912000&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=UgVcZhux6xWtTGHRZgs8q-iZhpnRmKsohC9FyVeNPVQt9A7jq8eKAK--vkfKFXoUFgnuOuQbGAV-el85JXdWhrmMpBNjZlEhYl-dDY5qTMC6XzH1fYE1H8ttye~VCa4mmfS6Qho2ohcrLL~VSTrpskhMg7c7Dn0-X~oQ0VoBacBiDJcgCMhxYUuFoeQ-ky~BIb8wUU1ZH5~gDytCfhsNxLC3N4DhJKD82HxPOLNDJn0~mCuxHg0WzeDQblCvw-mwBduqHSGDlcm4IVxnjaVedCZIUJHAgMStWi1aWySM-NoRghg-AskzjhrZ0dT86iD1zgnA-mwCL7kwQ~VWpbj7Zg__";
  }

  if (props.index === 2) {
    return "https://s3-alpha-sig.figma.com/img/216f/602f/2425f8e0e9b4eab995afb91006ac56cd?Expires=1734912000&Key-Pair-Id=APKAQ4GOSFWCVNEHN3O4&Signature=inNDLTycZcT0mr6G9h1bfL9t0OWOFWhhUjvDeK5KPCgN8APXqW8cnmO4rqCw63qlgs9iZs4D-OKEOlEWMvsHfeDe6mms~W7Oo6-rRQID4QWTHf5wdvtybZjoapQVFljPGWpR7C2Ihg9ypOEwE6Kt~sk0bisYKpuC8nsux~7XoZHvfqcKOVUUd3l-jTrQbz69lwZrkAXnhv8JUIKQfycvwNczk3VGDSBLP1VR3Afna0~xadJKSjW0cBSIWkWx3LZrXVMCsq4Ek3cYB8UrVmMRdFlck-9S8VRBpWUblVjq3ATAiRzfndCblVJLj3VpEn94EnJJognnLWk~aCu8iQ-gIg__";
  }

  return null;
};
</script>
