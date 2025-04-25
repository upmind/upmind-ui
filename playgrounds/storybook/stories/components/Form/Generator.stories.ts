// --- external
import { ref, computed } from "vue";
import type { Meta, StoryObj } from "@storybook/vue3";
import { useI18n } from "vue-i18n";
// --- internal
import * as messages from "./locales";
// import { countries } from "country-data";

// --- components
import { Form } from "@upmind-automation/upmind-ui";

// --- utils
import { isEmpty, omitBy } from "lodash-es";
// -----------------------------------------------------------------------------

const meta: Meta<typeof Form> = {
  parameters: {
    controls: {
      exclude: [
        "ajv",
        "mode",
        "additionalErrors",
        "schema",
        "uischema",
        "modelValue",
      ],
    },
    docs: {
      story: {
        inline: true,
      },
      description: {
        component:
          "A component for dynamically generating forms based on a JSON schema.",
      },
    },
  },
  component: Form,
  render: args => ({
    components: { Form },
    setup() {
      const { t } = useI18n();
      const isValid = ref(false);
      const model = ref({});

      function doReject() {}

      function doResolve(value) {}

      return {
        t,
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
      <Form
       :locale="$i18n.locale"
       :translator="t"
        v-bind="args"
        v-model="model"
        @valid="isValid = $event"
      />

      <div class="w-full flex-1 self-stretch rounded-lg bg-background-100 p-4 mt-8">
        <strong class="font-mono uppercase">{{t("form.model", formStatus)}}</strong>
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
          maxLength: 10,
          title: "What is your name?",
          description: "Please enter your full name",
          i18n: "form.name",
        },

        password: {
          type: "string",
        },

        date: {
          title: "What is your date of birth?",
          type: "string",
          format: "date",
        },

        // categories: {
        //   type: "array",
        //   uniqueItems: true,
        //   items: {
        //     type: "string",
        //     enum: ["Work", "Personal", "Urgent", "Long-term", "Short-term"],
        //   },
        //   i18n: "taskform.categories",
        // },

        phone: {
          type: "object",
          title: "Phone",
          isPhoneNumber: "GB",
          properties: {
            number: {
              type: ["string", "null"],
              title: "Phone number",
            },

            country: {
              type: ["string", "null"],
              title: "Country",
            },

            countryCallingCode: {
              type: ["string", "null"],
              title: "Country calling code",
            },
          },
        },

        age: {
          type: "integer",
          title: "How old are you?",
          exclusiveMinimum: 0,
          exclusiveMaximum: 120,
          i18n: "form.age",
        },
        postalCode: {
          type: "string",
          maxLength: 5,
          title: "What is your postal/zip code?",
          i18n: "form.postalCode",
        },
        about: {
          type: "string",
          title: "Tell us about yourself",
          maxLength: 280,
          i18n: "form.about",
        },
        accept: {
          type: "boolean",
          title: "Do you accept the terms and conditions?",
          description: "Must be accepted to use our service",
          i18n: "form.accept",
        },

        personalData: {
          type: "object",
          properties: {
            weight: {
              type: "number",
              minimum: 0,
              maximum: 250,
              title: "How much do you weigh?",
              i18n: "form.weight",
            },
            height: {
              type: "integer",
              minimum: 120,
              maximum: 220,
              title: "How tall are you?",
              i18n: "form.height",
            },
            drivingSkill: {
              type: "number",
              title: "How good are you at driving?",
              i18n: "form.drivingSkill",
              oneOf: [
                {
                  title: "pro",
                  const: 3,
                },
                {
                  title: "okay",
                  const: 2,
                },
                {
                  title: "beginner",
                  const: 1,
                },
                {
                  title: "dont",
                  const: 0,
                },
              ],
            },
            vegetarian: {
              type: "boolean",
              title: "Are you a vegetarian?",
              i18n: "form.vegetarian",
            },
            nationality: {
              type: "string",
              enum: ["DE", "IT", "JP", "US", "RU", "Other"],
              title: "What is your nationality?",
              i18n: "form.nationality",
            },
            nationalityDetailed: {
              type: "string",
              oneOf: [
                {
                  title: "Germany",
                  const: "DE",
                },
                {
                  title: "Italy",
                  const: "IT",
                },
                {
                  title: "Japan",
                  const: "JP",
                },
                {
                  title: "United States",
                  const: "US",
                },
                {
                  title: "Russia",
                  const: "RU",
                },
                {
                  title: "Other",
                  const: "Other",
                },
              ],
              title: "What is your nationality?",
              i18n: "form.nationality",
            },
            occupation: {
              type: "string",
              title: "What is your occupation?",
              i18n: "form.occupation",
            },
          },
          required: ["weight", "height", "drivingSkill"],
        },
      },
      required: ["name", "accept", "age", "switch", "toggle"],
      // errorMessage: {
      //   properties: {
      //     accept: "We require you accept our Terms and Conditions",
      //   },
      // },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Form>;

export const Base: Story = {
  args: {},
};

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
              options: {
                format: "date",
                min: "2024-10-16",
              },
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
          i18n: "taskform.name",
        },

        description: {
          type: ["string", "null"],
          maxLength: 140,
          i18n: "taskform.description",
        },

        rating: {
          type: "integer",
          maximum: 5,
          minimum: 1,
          i18n: "taskform.rating",
        },

        impact: {
          type: "number",
          maximum: 10,
          minimum: 0,
          i18n: "taskform.impact",
        },

        dueDate: {
          type: ["string", "null"],
          format: "date",
          formatMinimum: new Date(Date.now()).toLocaleString(),
          i18n: "taskform.dueDate",
        },

        recurrence: {
          type: ["string", "null"],
          i18n: "taskform.recurrence",
          oneOf: [
            {
              const: "daily",
              i18n: "taskform.recurrence.options.daily",
            },
            {
              const: "weekly",
              i18n: "taskform.recurrence.options.weekly",
            },
            {
              const: "monthly",
              i18n: "taskform.recurrence.options.monthly",
              title: "Monthly",
            },
          ],
        },

        recurrenceInterval: {
          type: "integer",
          minimum: 1,
          maximum: 365,
          i18n: "taskform.recurrenceInterval",
        },

        done: {
          type: ["boolean", "null"],
          enum: [true, false, null],
          i18n: "taskform.done",
        },
      },
    },

    uischema: {
      type: "VerticalLayout",
      elements: [
        {
          type: "Label",
          i18n: "taskform.label",
        },

        {
          type: "Control",
          scope: "#/properties/name",
          options: {
            autoFocus: true,
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

          i18n: "taskform.completion",
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
