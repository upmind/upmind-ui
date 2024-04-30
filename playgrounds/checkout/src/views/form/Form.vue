<template>
  <article class="flex flex-wrap gap-4">
    <h3 class="w-full">{{ $t("form.title") }}</h3>

    <upw-form
      :locale="$i18n.locale"
      :translator="$t"
      v-model="model"
      :schema="schema"
      :uischema="uischema"
      @reject="doReject"
      @resolve="doResolve"
      :loading="isLoading"
      @valid="isValid = $event"
    />

    <div class="w-1/2 flex-1 self-stretch rounded-lg bg-base-100 p-4">
      <strong class="font-mono uppercase">{{
        $tc("form.model", formStatus)
      }}</strong>

      <pre class="sticky top-0 text-wrap">{{ model }}</pre>
    </div>
  </article>
</template>

<script>
import { UpwForm } from "@upmind/upwind";
import { computed, defineComponent, ref } from "vue";
import { delay, isEmpty, omitBy } from "lodash-es";
import { useDateFormat, useNow } from "@vueuse/core";

import * as messages from "./locales";

export default defineComponent({
  name: "Offers",
  i18n: { messages },
  components: { UpwForm },
  setup: props => {
    const isLoading = ref(true);
    const isValid = ref(false);
    const model = ref({});

    const today = useDateFormat(useNow(), "YYYY-MM-DD");
    const now = useDateFormat(useNow(), "YYYY-MM-DD HH:mm:ss");

    function doReject() {}

    function doResolve(value) {}

    return {
      formStatus: computed(() =>
        !isEmpty(omitBy(model.value, isEmpty)) ? (isValid.value ? 1 : 2) : 0
      ),
      isLoading,
      isValid,
      model,
      today,
      now,
      doReject,
      doResolve,
    };
  },
  computed: {
    schema() {
      return {
        required: ["name", "rating"],
        properties: {
          name: {
            type: ["string"],
            i18n: "form.name",
          },

          description: {
            type: ["string", "null"],
            maxLength: 140,
            i18n: "form.description",
          },

          rating: {
            type: "integer",
            maximum: 5,
            minimum: 1,
            i18n: "form.rating",
          },

          impact: {
            type: "number",
            maximum: 10,
            minimum: 0,
            i18n: "form.impact",
          },

          dueDate: {
            type: ["string", "null"],
            format: "date",
            formatMinimum: this.today,
            i18n: "form.dueDate",
          },

          recurrence: {
            type: ["string", "null"],
            i18n: "form.recurrence",
            oneOf: [
              {
                const: "daily",
                i18n: "form.recurrence.options.daily",
              },
              {
                const: "weekly",
                i18n: "form.recurrence.options.weekly",
              },
              {
                const: "monthly",
                i18n: "form.recurrence.options.monthly",
                title: "Monthly",
              },
            ],
          },

          recurrenceInterval: {
            type: "integer",
            minimum: 1,
            maximum: 365,
            i18n: "form.recurrenceInterval",
          },

          done: {
            type: ["boolean", "null"],
            enum: [true, false, null],
            i18n: "form.done",
          },
        },
      };
    },

    uischema() {
      return {
        type: "VerticalLayout",
        elements: [
          {
            type: "Label",
            i18n: "form.label",
          },

          {
            type: "Control",
            scope: "#/properties/name",
            options: {
              placeholder: this.$t("form.name.placeholder"),
              focus: true,
            },
          },

          {
            type: "Control",
            scope: "#/properties/description",
            options: {
              multi: true,
              autosize: true,
            },
          },

          {
            type: "HorizontalLayout",
            elements: [
              {
                type: "Control",
                scope: "#/properties/rating",
              },

              {
                type: "Control",
                scope: "#/properties/impact",
              },
            ],
          },

          {
            type: "HorizontalLayout",
            elements: [
              {
                type: "Control",
                scope: "#/properties/recurrence",
                options: {
                  format: "radio",
                },
              },
              {
                type: "Control",
                scope: "#/properties/recurrenceInterval",
                options: {
                  min: 1,
                  max: 365,
                  suffix: "days",
                },
                rule: {
                  effect: "SHOW",
                  condition: {
                    scope: "#/properties/recurrence",
                    schema: { type: "string", const: "Daily" },
                  },
                },
              },
              {
                type: "Control",
                scope: "#/properties/recurrenceInterval",
                options: {
                  min: 1,
                  max: 52,
                  suffix: "weeks",
                },
                rule: {
                  effect: "SHOW",
                  condition: {
                    scope: "#/properties/recurrence",
                    schema: { type: "string", const: "Weekly" },
                  },
                },
              },
              {
                type: "Control",
                scope: "#/properties/recurrenceInterval",
                options: {
                  min: 1,
                  max: 12,
                  suffix: "months",
                },
                rule: {
                  effect: "SHOW",
                  condition: {
                    scope: "#/properties/recurrence",
                    schema: { type: "string", const: "Monthly" },
                  },
                },
              },
            ],
          },

          {
            type: "Group",
            label: "Task Completion",
            elements: [
              {
                type: "Control",
                scope: "#/properties/dueDate",
              },

              {
                type: "Control",
                scope: "#/properties/done",
              },
            ],
          },
        ],
      };
    },
  },
  mounted() {
    delay(() => {
      this.isLoading = false;
    }, 1000);
  },
});
</script>
