import { html } from "lit";

/**
 * Primary UI component for user interaction
 */
export const Button = ({ variant, color, size, label, onClick }) => {
  return html`
    <uw-button
      variant=${variant}
      color=${color}
      size=${size}
      @click=${onClick}
      label=${label}
    ></uw-button>
  `;
};
