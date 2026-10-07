## Gate bindings (graphify-gate.sh)

- per-module-names: Context, ContextTypes, Actions, Meta, Internals, Props, ScopeMatrix, QueryModel, FilterModel, SortEntry, SortModel, ListQuery

## Gate bindings (rules)

Read by the upmind-agent `lint-on-save` hook. `{file}` is the saved file, relative to the repository root. The command uses an empty suppressions file, so every lint error in the saved file is reported, old or new (ruling D8).

- lint-file: node_modules/.bin/eslint --no-warn-ignored --suppressions-location etc/ci/lint/no-suppressions.json --pass-on-unpruned-suppressions {file}
