# Contributing to YOU

YOU's core promise is user controlled personal context. Contributions should preserve that promise.

## Before a pull request

- Keep example people and events fictional. Never commit real contact details, message contents, tokens, or exports.
- Label demo behavior and unimplemented connectors clearly.
- Preserve provenance, confidence, and unknown states for every new fact type.
- Add user review before an inferred fact becomes known or before identities are merged.
- Put new integrations behind explicit, narrow authorization. Follow official APIs and platform rules.
- Keep agent access independent of model vendors. New harness adapters should use the same scoped contract.
- Explain the user visible behavior, permissions, and data retention of a connector in the pull request.

For now, run `npm run build` for changes to the app. The prototype has no production backend or connector test suite yet.
