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
        iframeHeight: 510,
      },
      description: {
        component:
          "A form renderer specialized for numerical input with validation.",
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
          type: "integer",
          minLength: 3,
          title: "What is your name?",
          description: "Please enter your full name",
        },
        dob: {
          type: "integer",
          format: "date",
          title: "What is your date of birth?",
        },
        postalCode: {
          type: "integer",
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
              type: "integer",
              enum: ["DE", "IT", "JP", "US", "RU", "Other"],
              title: "What is your nationality?",
            },
            occupation: {
              type: "integer",
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
type Story = StoryObj<typeof Form>;

export const Base: Story = {
  args: {
    schema: {
      type: "object",
      properties: {
        integer: {
          type: "integer",
          title: "Integer Input",
        },
        number: {
          type: "number",
          title: "Float Number Input",
        },
      },
    },
    uischema: {
      type: "VerticalLayout",
      elements: [
        {
          type: "Control",
          scope: "#/properties/integer",
        },

        {
          type: "Control",
          scope: "#/properties/number",
        },
        {
          type: "Control",
          scope: "#/properties/number",
          options: {
            prependText: "$",
            apendText: ".00",
            label: "Simple currency input",
          },
        },
      ],
    },
  },
};

export const Restricted: Story = {
  args: {
    schema: {
      type: "object",
      required: ["single"],
      properties: {
        single: {
          type: "number",
          title: "Required Number",
          description: "With a hint to give context",
        },

        singleWithRange: {
          type: "number",
          title: "Restricted Number with Inclusive Range",
          description: "With range between 0 and 10 (inclusive)",
          minimum: 0,
          maximum: 10,
        },

        singleWithRangeExclusive: {
          type: "number",
          title: "Restricted Number with Exclusive Range",
          description: "With range between 0 and 10 (exclusive)",
          exclusiveMinimum: 0,
          exclusiveMaximum: 10,
        },
      },
    },
  },
};
