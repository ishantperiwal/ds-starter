# Pipeline settings and LLM guidance audit

Scope: `pipeline-settings.html` and the instructions used to build or migrate CRM screens.
No persistence behavior, API contract, mailbox UI or deployment was changed.

## Adoption changes

- Five existing card shells now use `ds-card ds-card--section`; their page hook classes remain.
- Main name/owner and confirmation fields use `ds-input`; standard actions and close/add
  controls use registered button variants. Redundant local control styles were removed.
- Page and modal insets, sections and action gaps consume shared pattern roles. Static
  visual colors, typography, borders, radii and shadows use design-system tokens.
- Dialogs expose accessible names and modal semantics, constrain keyboard focus, dismiss
  through existing close handlers, restore focus and make background content inert.
- Narrow automation rows can wrap. Existing routing, IDs and save handlers remain intact.

## Intentional local ownership

The settings rail, stage chevrons, task/rule editor and modal shell have no registered
component equivalent. They retain page-owned structure and geometry while consuming tokens.
Pipeline and integration colors are data/brand values. Fixed rail/modal widths, stage shapes,
sticky positioning and editor-specific dimensions remain local. These are not new public
DS components. The delete confirmation retains a wider horizontal inset as a scoped exception.

This migration normalizes visual values to the shared system; it is not pixel-identical to
its previous local styles. Shared-token changes now propagate through these adopted properties.

## Guidance findings and resolution

The registry and component contracts already give useful machine-readable anatomy, states
and spacing ownership. The main weakness was conflicting appended documentation: code
accordions, copied samples and live-data dependencies were described alongside their replacements.
Those superseded instructions were removed. DESIGN-SYSTEM.md now has a canonical LLM workflow,
linked from CLAUDE.md, covering new screens, migrations, ownership, exceptions and validation.

Guidance is not automatic enforcement. Adoption/inventory scripts are heuristic reports;
they do not detect every CSS override, missing state or inaccessible interaction. LLM changes
still require inspection of actual consumer CSS and rendered behavior. Do not equate a count,
a shared class or a matching pixel value with compliance.

## Verification

- Inline JavaScript syntax and referenced token definitions checked successfully.
- Adoption and inventory scripts run without `--write`; no generated inventory results saved.
- `git diff --check` passed.
- Browser inspected actual settings stage and automation views and the workbench settings
  example. Actual settings loaded data and showed the shared card/input classes.
- Delete confirmation opened and dismissed without submitting: modal semantics and background
  scroll lock were verified. No records were saved or deleted.
- Narrow-width and alternate-theme visual checks, all keyboard paths and persistence regression
  checks were not completed in this pass. Responsive rules were reviewed in source.
