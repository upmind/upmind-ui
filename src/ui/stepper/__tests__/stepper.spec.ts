import { mount } from "@vue/test-utils";
import { describe, it, expect, beforeAll } from "vitest";
import type { StepperStepProps } from "../../../index";

let barrel: typeof import("../../../index");

beforeAll(async () => {
  // lottie-web (icon-animated's dep) probes canvas support at import time;
  // jsdom has no native 2D context, so a bare barrel import throws before
  // any test runs. Stub only what that probe touches, then import for real.
  HTMLCanvasElement.prototype.getContext = (() => ({
    fillStyle: "",
    fillRect: () => {}
  })) as unknown as typeof HTMLCanvasElement.prototype.getContext;

  barrel = await import("../../../index");
});

describe("stepper", () => {
  it("resolves the stepper family from the package barrel", () => {
    expect(barrel.Stepper).toBeTruthy();
    expect(barrel.StepperRoot).toBeTruthy();
    expect(barrel.StepperItem).toBeTruthy();
    expect(barrel.StepperTrigger).toBeTruthy();
    expect(barrel.StepperIndicator).toBeTruthy();
    expect(barrel.StepperTitle).toBeTruthy();
    expect(barrel.StepperDescription).toBeTruthy();
    expect(barrel.StepperSeparator).toBeTruthy();
  });

  it("mounts and renders every step's title and description", () => {
    const steps: StepperStepProps[] = [
      { step: 1, title: "Details", description: "Enter your details" },
      { step: 2, title: "Payment", description: "Add a payment method" },
      { step: 3, title: "Confirm", description: "Review and confirm" }
    ];

    const wrapper = mount(barrel.Stepper, {
      props: { steps, modelValue: 2 }
    });

    const text = wrapper.text();

    steps.forEach(step => {
      expect(text).toContain(step.title);
      expect(text).toContain(step.description);
    });
  });

  it("renders one title and one description component per step", () => {
    const steps: StepperStepProps[] = [
      { step: 1, title: "Details", description: "Enter your details" },
      { step: 2, title: "Payment", description: "Add a payment method" }
    ];

    const wrapper = mount(barrel.Stepper, {
      props: { steps, modelValue: 1 }
    });

    expect(wrapper.findAllComponents(barrel.StepperTitle)).toHaveLength(
      steps.length
    );
    expect(wrapper.findAllComponents(barrel.StepperDescription)).toHaveLength(
      steps.length
    );
  });

  it("forwards each step's own disabled flag to its StepperItem, not a shared value", () => {
    const steps: StepperStepProps[] = [
      { step: 1, title: "Details", description: "Enter your details" },
      {
        step: 2,
        title: "Payment",
        description: "Add a payment method",
        disabled: true
      },
      { step: 3, title: "Confirm", description: "Review and confirm" }
    ];

    const wrapper = mount(barrel.Stepper, {
      props: { steps, modelValue: 1 }
    });

    const stepperItems = wrapper.findAllComponents(barrel.StepperItem);

    expect(stepperItems).toHaveLength(steps.length);
    expect(stepperItems[0].props("disabled")).toBeFalsy();
    expect(stepperItems[1].props("disabled")).toBe(true);
    expect(stepperItems[2].props("disabled")).toBeFalsy();
  });
});
