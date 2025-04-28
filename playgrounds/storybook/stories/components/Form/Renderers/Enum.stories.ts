// --- external
import { ref } from "vue";
import type { Meta, StoryObj } from "@storybook/vue3";

// --- components
import { Form } from "@upmind-automation/upmind-ui";

// --- utils
import { useSystemArgTypes } from "../../../../utils";

// -----------------------------------------------------------------------------

const meta: Meta<typeof Form> = {
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
    docs: {
      story: {
        iframeHeight: 375,
      },
      description: {
        component:
          "A form renderer for enumerated values that presents options in a selectable format.",
      },
    },
  },
  component: Form,
  render: args => ({
    components: { Form },
    setup() {
      const model = ref({});

      function doReject() {
        alert("Rejected");
      }

      function doResolve(value: any) {
        alert(`Resolved: ${JSON.stringify(value)}`);
      }
      return {
        args,
        model,
        doReject,
        doResolve,
      };
    },
    template: `
      <Form
        v-bind="args"
        v-model="model"
        @reject="doReject"
        @resolve="doResolve"
      />

      <h4>Model</h4>
      <pre class="sticky top-0 rounded-lg bg-background-100 p-4">{{ model }}</pre>
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
} satisfies Meta<typeof Form>;

export default meta;
type Story = StoryObj<typeof Form>;

export const Base: Story = {
  args: {
    schema: {
      type: "object",
      properties: {
        simple: {
          title: "Simple Enum dropdown",
          description: "NB: there is no difference between value and label",
          type: ["string", "null"],
          enum: ["daily", "weekly", "monthly"],
        },
      },
    },
  },
};
