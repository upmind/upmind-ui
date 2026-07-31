import type {
  StepCatalog,
  StepDef,
  StepHandler,
  StepKind,
  StepRegistrar
} from "./steps.types";

/**
 * Collects a `<module>.steps.ts`'s `Given`/`When`/`Then` registrations into a
 * {@link StepCatalog}. Engine-free: the catalog holds pattern
 * strings and handlers only — matching and registration against a real
 * engine is each executor's job, never this package's.
 */
export function defineSteps(
  build: (registrar: StepRegistrar) => void
): StepCatalog {
  const steps: StepDef[] = [];

  const register =
    (kind: StepKind) =>
    (pattern: string, handler: StepHandler): void => {
      steps.push({ kind, pattern, handler });
    };

  build({
    Given: register("Given"),
    When: register("When"),
    Then: register("Then")
  });

  return { steps };
}
