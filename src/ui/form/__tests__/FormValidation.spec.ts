import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import FormField from "../FormField.vue";
import Input from "../../input/Input.ce.vue";

describe("FormField Validation", () => {
  it("displays validation errors when touched and invalid", async () => {
    const errorMsg = "Field is required";
    const wrapper = mount(FormField, {
      props: {
        id: "test-field",
        label: "Test Field",
        name: "testField",
        touched: true,
        errors: [errorMsg]
      },
      slots: {
        default: () => '<input type="text" />'
      }
    });

    // Check if error message is rendered
    expect(wrapper.text()).toContain(errorMsg);

    // Check for accessibility attributes often associated with errors (optional but good practice)
    const message = wrapper.find('[id^="form-item-message"]');
    expect(message.exists()).toBe(true);
    expect(message.classes()).toContain("text-accent-danger");
  });

  it("does not display errors when not touched", async () => {
    const errorMsg = "Field is required";
    const wrapper = mount(FormField, {
      props: {
        id: "test-field",
        label: "Test Field",
        name: "testField",
        touched: false, // Not touched yet
        errors: [errorMsg]
      },
      slots: {
        default: () => '<input type="text" />'
      }
    });

    expect(wrapper.text()).not.toContain(errorMsg);
  });

  it("displays error when input is cleared (empty) and field is touched", async () => {
    // This scenario is technically covered by the first test, but this
    // explicitly represents the state where a user had a value, cleared it,
    // and triggered the 'required' validation.
    const errorMsg = "Field is required";
    const wrapper = mount(FormField, {
      props: {
        id: "test-field-cleared",
        label: "Test Field",
        name: "testFieldCleared",
        touched: true, // User has interacted
        errors: [errorMsg] // Validation failed due to empty value
      },
      slots: {
        // Explicitly rendering an empty input to represent the cleared state
        default: () => '<input type="text" value="" />'
      }
    });

    expect(wrapper.text()).toContain(errorMsg);
  });
});
