import { html } from "lit";

/**
 * Primary UI component for user interaction
 */
export const Button = ({ variant, color, size, label, onClick }) => {
  return html`
    <h1>Button</h1>
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
