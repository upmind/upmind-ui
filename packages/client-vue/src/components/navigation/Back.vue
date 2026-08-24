<template>
  <Button
    v-if="button"
    as-child
    variant="subtle"
    :size="size"
    class="self-start"
  >
    <RouterLink v-if="to" :to="to">
      <Icon v-if="icon" :icon="icon" />
      {{ safeLabel }}
    </RouterLink>
    <a v-else :href="href">
      <Icon v-if="icon" :icon="icon" />
      {{ safeLabel }}
    </a>
  </Button>
  <Link
    v-else
    :to="to"
    :href="href"
    :size="size"
    :color="color"
    class="self-start"
  >
    <Icon v-if="icon" :icon="icon" />
    {{ safeLabel }}
  </Link>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { RouterLink } from "vue-router";
import { Link } from "@upmind/ui";
import { Button } from "@upmind/ui";
import { Icon } from "../icon";
import type { BackProps } from "./types";

const { t } = useI18n();

// The retired lib's Link collapsed md and lg both onto 16px; here that is md.
const props = withDefaults(defineProps<BackProps>(), {
  size: "md",
  color: "muted"
});

const safeLabel = computed(() => props.label || t("action.back_to_basket"));
</script>
