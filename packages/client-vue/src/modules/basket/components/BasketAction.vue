<template>
  <!-- `as`, not `as-child`: Button suppresses asChild while loading, which would
       drop the root back to <button> and nest this anchor inside it. -->
  <Button
    v-if="props.basketRoute && headerMeta.showBasket"
    :as="RouterLink"
    :to="props.basketRoute"
    :loading="
      !basketMeta.isAvailable &&
      (basketMeta.isLoading || basketMeta.isProcessing) &&
      isAuthenticated
    "
    variant="ghost"
    size="lg"
  >
    <Icon icon="shopping-bag-02" />
    <Transition name="label-slide">
      <i18n-t
        v-if="count > 0"
        keypath="cart.basket_count"
        scope="global"
        :plural="count"
        tag="span"
        class="hidden px-1 md:inline"
      >
        <template #[`count`]>
          <Transition name="count-slide" mode="out-in">
            <span
              :key="count"
              data-test-key="basket-action-count"
              class="inline-block"
              :class="count < 10 ? 'min-w-2.5' : 'min-w-5'"
            >
              {{ count }}
            </span>
          </Transition>
        </template>
      </i18n-t>
    </Transition>
  </Button>
</template>
<script lang="ts" setup>
import { Button } from "@upmind/ui";
import { RouterLink } from "vue-router";
import { useBasket, useActiveSession } from "@upmind-automation/headless";
import { useHeader } from "../../../components/header/useHeader";
import { Icon } from "../../../components/icon";
// --- types
import type { BasketActionProps } from "./types";

// -----------------------------------------------------------------------------

const props = defineProps<BasketActionProps>();

const { isAuthenticated } = useActiveSession().useMeta();

const { count, meta: basketMeta } = useBasket();
// the chrome decides whether a basket shortcut belongs in the header
const { meta: headerMeta } = useHeader();
</script>

<style scoped>
.count-slide-enter-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.count-slide-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.count-slide-enter-from {
  transform: translateY(20px);
  opacity: 0;
}

.count-slide-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}

.label-slide-enter-active {
  transition: all 0.3s ease;
}

.label-slide-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
  width: 0;
  margin: 0;
  padding: 0;
}

.label-slide-enter-from,
.label-slide-leave-to {
  transform: translateX(20px);
  opacity: 0;
}
</style>
