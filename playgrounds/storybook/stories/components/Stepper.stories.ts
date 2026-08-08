// --- external

// -- components
import { Stepper } from "@upmind-automation/upmind-ui";
import type { Meta, StoryObj } from "@storybook/vue3";
import type { StepperStepProps } from "@upmind-automation/upmind-ui";

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

// One step per state so completed / active / inactive / disabled are all visible.
export const States: Story = {
  args: {
    defaultValue: 2,
    steps: [
      {
        step: 1,
        title: "Completed",
        description: "Done step",
        completed: true
      },
      { step: 2, title: "Active", description: "Current step" },
      { step: 3, title: "Inactive", description: "Upcoming step" },
      {
        step: 4,
        title: "Disabled",
        description: "Cannot proceed",
        disabled: true
      }
    ] as StepperStepProps[]
  }
};

export const StatesVertical: Story = {
  args: {
    ...States.args,
    orientation: "vertical"
  }
};
