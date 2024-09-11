// --- external
import { defineCustomElement } from "vue";

// --- custom elements
import Button from "./Button.ce.vue";
const ButtonCE = defineCustomElement(Button);

// Buttons need to be form associated to be focusable
// and to be able to submit forms
export class UwButton extends ButtonCE {
  static formAssociated = true;
  _internals: ElementInternals;
  constructor() {
    super();
    this._internals = this.attachInternals();
  }
  connectedCallback() {
    // So this is a special case where we need to add an event listener
    // to the button to handle form submission and reset
    const form = this._internals.form;
    if (!!form && this.getAttribute("type")) {
      this.addEventListener("click", () => this.handleClick());
    }
    return super.connectedCallback();
  }

  private handleClick() {
    const form = this._internals.form;
    if (form) {
      const type = this.getAttribute("type");
      switch (type) {
        case "submit":
          form.requestSubmit();
          break;
        case "reset":
          form.reset();
          break;
        default:
          break;
      }
    }
  }
}
