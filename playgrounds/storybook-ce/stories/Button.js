import { html } from "lit";
// import { styleMap } from "lit/directives/style-map.js";
import { UwButton } from "@upmind/upwind";
customElements.define("uw-button", UwButton);
/**
 * Primary UI component for user interaction
 */
export const Button = ({ variant, color, size, label, onClick }) => {
  return html`
    <uw-button
      type="button"
      variant=${variant}
      color=${color}
      size=${size}
      @click=${onClick}
      label=${label}
    ></uw-button>
  `;
};
