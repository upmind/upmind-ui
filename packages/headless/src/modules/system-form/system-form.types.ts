/**
 * Interface representing the API of a generic form composable.
 * This contract defines common methods and properties expected from composables
 * that manage form state, data, and interactions, typically backed by an XState machine.
 */
export interface FormComposable {
  /**
   * Retrieves a function that returns the current data model of the form.
   *
   * @returns A function that, when called, returns the current form's data model.
   */
  getModel: () => (...args: unknown[]) => unknown;
  /**
   * Sets the default values for the form's data model.
   * This typically resets the form to a predefined state.
   *
   * @param value - The object containing the default values to set.
   * @returns A promise that resolves when the default values have been set.
   */
  setDefault: (value: any) => Promise<any>;
  /**
   * Triggers an update or re-evaluation of the form's state or data.
   * This might involve re-validating the form or re-fetching dependent data.
   *
   * @returns A promise that resolves when the update operation is complete.
   */
  update: () => Promise<any>;
  /**
   * Processes input changes to the form's data model.
   * This method is typically called in response to user input events on form fields.
   *
   * @param value - The new value or partial value to apply to the form's data model.
   * @returns A promise that resolves when the input has been processed and the model updated.
   */
  input: (value: any) => Promise<any>;
  /**
   * Clears the current state and data of the form, typically resetting it to an empty or initial state.
   *
   * @returns `void`
   */
  clear: () => void;
  /**
   * Stops any underlying services or processes managed by the form composable.
   * This should be called to clean up resources, e.g. on a component unmounted.
   *
   * @returns `void`
   */
  stop: () => void;
  /**
   * Returns a promise that resolves when the form composable is ready for interaction.
   * This typically means its internal state machine has reached an 'available' state.
   *
   * @returns A promise is resolving to `true` when ready.
   */
  isReady: () => Promise<boolean>;
  /**
   * Retrieves the current state of the underlying XState machine or equivalent state representation.
   *
   * @returns The current state object.
   */
  state: () => any;
  /**
   * Retrieves the current context (extended state) of the underlying XState machine or equivalent.
   *
   * @returns The current context object.
   */
  context: () => any;
  /**
   * Retrieves any error objects associated with the form's state or validation.
   *
   * @returns An object or array containing form errors.
   */
  errors: () => any;
  /**
   * The JSON Schema defining the structure and validation rules for the form.
   */
  schema: any;
  /**
   * The UI Schema defining the presentation and layout of the form fields.
   */
  uischema: any;
}
