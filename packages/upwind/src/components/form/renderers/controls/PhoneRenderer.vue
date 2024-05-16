<template>
  <upw-textbox
    v-bind="{ ...control, ...appliedOptions }"
    :id="control.id + '-input'"
    :disabled="!control.enabled"
    :model-value="control.data?.number"
    @change="onChange"
    type="phone"
  >
    <template #prepend="{}">
      <upw-listbox
        class="self-center"
        :disabled="!control.enabled"
        :model-value="control.data?.country || defaultCountryCode"
        :items="countries"
        has-search
        icon-only
        @update:modelValue="onChangeCountry"
        grouped
        size="sm"
      />
    </template>
  </upw-textbox>
</template>

<script lang="ts">
// --- external
import { computed, defineComponent, ref } from "vue";
import { schemaMatches, and, isObjectControl } from "@jsonforms/core";
import { rendererProps, useJsonFormsControl } from "@jsonforms/vue";
// ---
import isoCountries from "i18n-iso-countries";
import enCountries from "i18n-iso-countries/langs/en.json";

// --- components
import UpwTextbox from "../../../textbox/Textbox.vue";
import UpwListbox from "../../../listbox/Listbox.vue";

// --- utils
import { useUpwindRenderer } from "../utils";
import { get, set, reduce, keys } from "lodash-es";

// --- types
import type { ControlElement } from "@jsonforms/core";
import type { RendererProps } from "@jsonforms/vue";

export default defineComponent({
  name: "PhoneRenderer",
  components: {
    UpwTextbox,
    UpwListbox,
  },
  props: {
    ...rendererProps<ControlElement>(),
  },

  setup(props: RendererProps<ControlElement>) {
    const renderer = useUpwindRenderer(
      useJsonFormsControl(props),
      target => target?.value
    );

    const defaultCountryCode = get(
      renderer,
      "control.value.schema.isPhoneNumber"
    );

    const phone = ref({ ...renderer.control.value.data });

    function onChangeCountry(value: string) {
      set(phone.value, "country", value);
      // forward the event to the input control that will trigger the update
      // NB: this is not a DOM event so we need to fake one for the renderer
      renderer.onChange({
        currentTarget: { value: phone.value },
      });
    }

    function onChange(target: Event) {
      set(phone.value, "number", target.currentTarget.value);
      // forward the event to the input control that will trigger the update
      // NB: this is not a DOM event so we need to fake one for the renderer
      renderer.onChange({
        currentTarget: { value: phone.value },
      });
    }

    // ------------------------------------------------

    isoCountries.registerLocale(enCountries);

    // ------------------------------------------------

    return {
      ...renderer,
      onChangeCountry,
      onChange,
      countries: computed(() => {
        const raw =
          renderer.appliedOptions.value?.countries ||
          keys(isoCountries.getNames("en", { select: "alias" }));

        const parsed = reduce(
          raw,
          (result, value) => {
            const country = {
              avatar: {
                path: "flags",
                name: (value?.code || value).toLowerCase(),
              },
              label: value?.name || value,
              value: value?.code || value,
            };

            result.push(country);
            return result;
          },
          []
        );
        return parsed;
      }),
      defaultCountryCode,
    };
  },
});

export const tester = {
  rank: 2,
  controlType: and(
    isObjectControl,
    schemaMatches(schema => !!schema?.isPhoneNumber)
  ),
};
</script>
