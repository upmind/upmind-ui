// --- external

// -- components
import { Stepper } from "@upmind-automation/upmind-ui";
import type { StepperStepProps } from "@upmind-automation/upmind-ui";
import type { Meta, StoryObj } from "@storybook/vue3";

// --- types

// -----------------------------------------------------------------------------
const meta: Meta<typeof Stepper> = {
  component: Stepper,
  argTypes: {
    orientation: {
      options: ["horizontal", "vertical"],
      control: { type: "select" }
    }
  },
  args: {
    defaultValue: 2,
    orientation: "horizontal",
    linear: false,
    steps: [
      {
        step: 1,
        title: "Account",
        description: "Your details",
        completed: true
      },
      { step: 2, title: "Billing", description: "Payment method" },
      { step: 3, title: "Confirm", description: "Review & submit" }
    ] as StepperStepProps[]
  },
  parameters: {
    docs: {
      description: {
        component:
          "A multi-step progress indicator rendered from a `steps` array."
      }
    }
  }
};

export default meta;
type Story = StoryObj<typeof Stepper>;

export const Base: Story = {};

export const Vertical: Story = {
  args: { orientation: "vertical" }
};
