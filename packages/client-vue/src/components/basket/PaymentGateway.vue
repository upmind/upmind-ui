<template>
  <section
    tabindex="0"
    ref="form"
    class=""
    :class="[
      meta.hasErrors ? ' border-error' : '',
      !meta.isRenderless ? '' : '',
    ]"
  >
    <div class="">
      <!-- gateway Render Content (* IF Provided) -->
      <div ref="container"></div>

      <!-- gateway Form (* IF Provided) -->
      <upw-form
        v-if="schema && uischema"
        tabindex="1"
        :additional-errors="errors?.data"
        :loading="meta.isLoading"
        :model-value="model"
        :processing="meta.isProcessing"
        :schema="schema"
        :uischema="uischema"
        @reject="clear"
        @resolve="update"
        @update:modelValue="input"
        no-actions
      >
      </upw-form>
    </div>
  </section>
</template>

<script lang="ts">
// --- external
import { defineComponent, onMounted, watch, ref } from "vue";

// --- internal
import { useBasketPaymentGateway } from "@upmind/flow-vue";

// --- components
import { UpwForm } from "@upmind/upwind";

// -----------------------------------------------------------------------------

export default defineComponent({
  name: "UpmBasketPaymentGateway",
  components: { UpwForm },
  props: {},
  setup(props) {
    const {
      errors,
      meta,
      model,
      schema,
      uischema,
      renderer,
      clear,
      input,
      update,
      render,
    } = useBasketPaymentGateway();

    const container = ref();
    // wait till we mount then try to render the gateway if it's provided
    // otherwise watch in case it's provided later
    onMounted(() => {
      gateway.render(container.value);
      watch(gateway.renderer, () => gateway.render(container.value));
    });

    return {
      container,

      errors,
      meta,
      model,
      schema,
      uischema,
      renderer,
      clear,
      input,
      update,
      render,
    };
  },
});
</script>
