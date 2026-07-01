import { JsonSchema7 } from "@jsonforms/core";

declare module "@jsonforms/core" {
  interface JsonSchema7 {
    use?: any;
  }
}
