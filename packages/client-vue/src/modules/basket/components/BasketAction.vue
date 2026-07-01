<template>
  <Button
    v-if="props.basketRoute"
    as="router-link"
    :to="props.basketRoute"
    :loading="
      !meta.isAvailable &&
      (meta.isLoading || meta.isProcessing) &&
      isAuthenticated
    "
    variant="ghost"
    size="lg"
    icon="shopping-bag-02"
  >
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
              data-testid="basket-action-count"
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
import { useActiveSession, useBasket } from "@upmind-automation/headless";
import { Button } from "@upmind-automation/upmind-ui";
import type { RouteLocationAsRelativeGeneric } from "vue-router";

// --- types

// -----------------------------------------------------------------------------

const props = defineProps<{
  basketRoute?: RouteLocationAsRelativeGeneric;
}>();

const { isAuthenticated } = useActiveSession().useMeta();

const { count, meta } = useBasket();
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
