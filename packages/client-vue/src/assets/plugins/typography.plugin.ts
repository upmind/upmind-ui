import plugin from "tailwindcss/plugin";
import { flatMap, map } from "lodash-es";

// Typography plugin for specific font-size + line-height combinations using CSS variables
export default plugin(function ({ matchUtilities }: any) {
  const textSizes = [
    "xs",
    "sm",
    "md",
    "lg",
    "xl",
    "2xl",
    "3xl",
    "4xl",
    "5xl",
    "6xl"
  ];

  const sizeVariants = flatMap(textSizes, (size: string) => {
    return map(["tight", "loose"], (variant: string) => ({
      [`${size}/${variant}`]: {
        "font-size": `var(--text-${size})`,
        "line-height": `var(--text-${size}--line-height-${variant})`
      }
    }));
  });

  matchUtilities(
    {
      text: (value: any) => value
    },
    { values: Object.assign({}, ...sizeVariants) }
  );
});
