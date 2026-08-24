<template>
  <div class="flex flex-col gap-2">
    <dl class="flex flex-col gap-1 lg:gap-0">
      <DetailsGroup
        v-for="(group, index) in groupedDetails"
        :key="'details-group-' + index"
        :id="id"
        :category="getCategory(group)"
        :items="group"
      />
    </dl>

    <Link :to="props.editRoute" size="sm" color="muted" class="self-start">{{
      t("text.edit_configuration")
    }}</Link>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { Link } from "@upmind/ui";
import DetailsGroup from "./components/DetailsGroup.vue";
import { groupBy, first } from "lodash-es";
import type { BasketProductConfigDetailsProps } from "./types";

defineOptions({
  inheritAttrs: false
});

const { t } = useI18n();

const props = defineProps<BasketProductConfigDetailsProps>();

function getCategory(group: BasketProductConfigDetailsProps["details"]) {
  const groupCategory = first(group)?.category;

  if (groupCategory === props.summary.category) {
    return "";
  }

  return groupCategory;
}

const groupedDetails = computed(
  (): Record<string, BasketProductConfigDetailsProps["details"]> => {
    return groupBy(props.details, "category");
  }
);
</script>
