// --- external
import { ref, computed } from "vue";
import type { Meta, StoryObj } from "@storybook/vue3";

// ---internal
import * as messages from "./locales";

// --- components
import { UpwForm } from "@upmind/upwind";
import { on } from "events";

// --- utils
import { isEmpty, omitBy } from "lodash";
import { useSystemArgTypes } from "../../../utils";
// -----------------------------------------------------------------------------

const meta: Meta<typeof UpwForm> = {
  parameters: {
    controls: {
      exclude: [
        "ajv",
        "mode",
        "additionalErrors",
        // "schema",
        // "uischema",
        "modelValue",
      ],
    },
  },
  component: UpwForm,
  render: args => ({
    components: { UpwForm },
    setup() {
      const isValid = ref(false);
      const model = ref({});

      function doReject() {}

      function doResolve(value) {}

      return {
        args,
        model,
        isValid,
        doReject,
        doResolve,
        formStatus: computed(() =>
          !isEmpty(omitBy(model.value, isEmpty)) ? (isValid.value ? 1 : 2) : 0
        ),
      };
    },
    i18n: { messages },
    template: `
      <upw-form
       :locale="$i18n.locale"
       :translator="$t"
        v-bind="args"
        v-model="model"
        @valid="isValid = $event"
      />

      <div class="w-full flex-1 self-stretch rounded-lg bg-base-100 p-4 mt-8">
      <strong class="font-mono uppercase">{{
        $tc("form.model", formStatus)
      }}</strong>

      <pre class="sticky top-0 text-wrap">{{ model }}</pre>
    </div>
    `,
  }),
  argTypes: {},
  args: {
    loading: false,
    processing: false,
    schema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          minLength: 3,
          title: "What is your name?",
          description: "Please enter your full name",
        },
        dob: {
          type: "string",
          format: "date",
          title: "What is your date of birth?",
        },
        postalCode: {
          type: "string",
          maxLength: 5,
          title: "What is your postal/zip code?",
        },

        personalData: {
          type: "object",
          properties: {
            weight: {
              type: "number",
              minimum: 0,
              maximum: 250,
              title: "How much do you weigh?",
            },
            height: {
              type: "integer",
              minimum: 120,
              maximum: 220,
              title: "How tall are you?",
            },
            drivingSkill: {
              type: "number",
              title: "How good are you at driving?",
              oneOf: [
                {
                  title: "I'm a pro",
                  const: 3,
                },
                {
                  title: "I'm okay",
                  const: 2,
                },
                {
                  title: "I'm a beginner",
                  const: 1,
                },
              ],
            },
            vegetarian: {
              type: "boolean",
              title: "Are you a vegetarian?",
            },
            nationality: {
              type: "string",
              enum: ["DE", "IT", "JP", "US", "RU", "Other"],
              title: "What is your nationality?",
            },
            occupation: {
              type: "string",
              title: "What is your occupation?",
            },
          },
          required: ["weight", "height"],
        },
      },
      required: ["name", "dob", "postalCode", "nationality"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof UpwForm>;

export const Base: Story = {};

export const Formatted: Story = {
  args: {
    uischema: {
      type: "VerticalLayout",
      elements: [
        {
          type: "Control",
          scope: "#/properties/name",
        },
        {
          type: "HorizontalLayout",
          elements: [
            {
              type: "Control",
              scope: "#/properties/dob",
            },
            {
              type: "Control",
              scope: "#/properties/postalCode",
            },
          ],
        },

        {
          type: "Group",
          label: "Personal Information",
          elements: [
            {
              type: "HorizontalLayout",
              elements: [
                {
                  type: "Control",
                  scope: "#/properties/personalData/properties/height",
                  options: {
                    appendText: "cm",
                  },
                },
                {
                  type: "Control",
                  scope: "#/properties/personalData/properties/weight",
                  options: {
                    appendText: "kg",
                  },
                },
              ],
            },
            {
              type: "Control",
              scope: "#/properties/personalData/properties/nationality",
            },
            {
              type: "Control",
              scope: "#/properties/personalData/properties/occupation",
              suggestion: [
                "Accountant",
                "Engineer",
                "Freelancer",
                "Journalism",
                "Physician",
                "Student",
                "Teacher",
                "Other",
              ],
            },
            {
              type: "Control",
              scope: "#/properties/personalData/properties/drivingSkill",
              options: {
                format: "radio",
              },
            },
            {
              type: "Control",
              scope: "#/properties/personalData/properties/vegetarian",
            },
          ],
        },
      ],
    },
  },
};

export const Task: Story = {
  args: {
    schema: {
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
          formatMinimum: new Date(Date.now()).toLocaleString(),
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
    },

    uischema: {
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

          i18n: "form.completion",
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
    },
  },
};
