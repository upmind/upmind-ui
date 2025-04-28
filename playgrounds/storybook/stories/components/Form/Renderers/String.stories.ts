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
        iframeHeight: 475,
      },
      description: {
        component:
          "A form renderer for text input with various format options and validation.",
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
};

export default meta;
type Story = StoryObj<typeof Form>;

export const Base: Story = {
  args: {
    schema: {
      type: "object",
      properties: {
        single: {
          type: "string",
          title: "Simple Text Input",
        },
        multi: {
          type: "string",
          title: "Multiline Text Input",
        },
      },
    },
    uischema: {
      type: "VerticalLayout",
      elements: [
        {
          type: "Control",
          scope: "#/properties/single",
        },
        {
          type: "Control",
          scope: "#/properties/multi",
          options: {
            multi: true,
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
          type: "string",
          title: "Required Input",
          description: "With a hint to give context",
        },

        singleWithLength: {
          type: "string",
          title: "Restricted Length Input",
          description: "With length restrictions (Min: 5, Max: 10)",
          minLength: 5,
          maxLength: 10,
        },

        singleWithPattern: {
          type: "string",
          title: "Restricted Pattern Input",
          description:
            "With a pattern restriction, placeholder and custom error message",
          pattern: "^([A-Z]){3}-\\d{2}-(.){4}$",
        },
      },
      errorMessage: {
        properties: {
          singleWithPattern:
            "Needs to match:  3 uppercase letters - 2 digits - any 4 characters",
        },
      },
    },
  },
};

export const Formatted: Story = {
  args: {
    schema: {
      type: "object",
      properties: {
        single: {
          type: "string",
          title: "Simple Text Input",
        },
        multi: {
          type: "string",
          title: "Multiline Text Input",
        },
        formatEmail: {
          type: "string",
          title: "Email Input",
          format: "email",
        },
        formatPassword: {
          type: "string",
          title: "Password",
          format: "password",
        },
        formatUrl: {
          type: "string",
          title: "URL Input",
          format: "uri",
        },
        formatDate: {
          type: "string",
          title: "Date Input",
          format: "date",
        },
        formatDateTime: {
          type: "string",
          title: "Date & Time Input",
          format: "date-time",
        },
      },
    },
    uischema: {
      type: "VerticalLayout",
      elements: [
        {
          type: "Control",
          scope: "#/properties/single",
          options: {
            prependAvatar: { name: "za", path: "flags" },
            prependIcon: "cog",
            prependText: "ABC",
            appendAvatar: { name: "gb", path: "flags" },
            appendIcon: "devices",
            appendText: "XYZ",
            label: "Simple Text Input with Kitchen Sink",
            placeholder: "Custom Placeholder",
          },
        },
        {
          type: "Control",
          scope: "#/properties/multi",
          options: {
            multi: true,
            rows: 5,
            prependAvatar: { name: "za", path: "flags" },
            prependText: "ABC",
            appendText: "XYZ",
            prependIcon: "cog",
            appendIcon: "devices",
            appendAvatar: { name: "gb", path: "flags" },
            label: "Multiline Text Autosize Input with Kitchen Sink",
            placeholder: "Custom Placeholder",
            autosize: true,
          },
        },
        {
          type: "Control",
          scope: "#/properties/formatEmail",
          options: {
            prependIcon: "email",
          },
        },
        {
          type: "Control",
          scope: "#/properties/formatPassword",
          options: {
            prependIcon: "password",
          },
        },
        {
          type: "Control",
          scope: "#/properties/formatUrl",
          options: {
            prependIcon: "url",
          },
        },
        {
          type: "Control",
          scope: "#/properties/formatDate",
        },
        {
          type: "Control",
          scope: "#/properties/formatDateTime",
        },
      ],
    },
  },
};
