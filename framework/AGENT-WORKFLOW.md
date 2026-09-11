# Shared workflow: build and grow an attached app’s DS

Read the app attachment’s studio.config.json, BRIEF.md, registry.json and decisions/,
plus the installed studio’s framework/CONTRACTS.md in full before implementing.
Resolve content, appRoot and studioRoot relative to the app configuration file.
This shared workflow updates with the studio. Local app instructions/constraints
remain authoritative for app decisions; the archived Titan guidance is historical.

## Authority and ownership

- A request to build a DS from supplied screens authorizes project token, component,
  registry, specimen and screen changes needed to deliver it.
- The configured content folder is the app DS source of truth. Existing app screens
  remain under appRoot in their current locations. Keep studio development inside
  the independent studio checkout only when explicitly asked to improve tooling.
- Never modify shared tool files merely to customize project appearance.
- Do not silently import sandbox tokens, brand colors or CRM semantics as defaults.
- Inspect user-selected existing screens in place. No inbox, copying or forced
  layout. Modify only the screens in scope; preserve unrelated app code and behavior.
- Initialize once if needed with `node <studioRoot>/studio.js init --app <appRoot>`.
  Default content is appRoot/app-design-system; a separate --content path is allowed.
  Existing content is never overwritten. Load the resulting configuration.
- Use fictional data for examples. Do not submit real app operations during testing.

## Mandatory: separate layout recipes from components

When breaking down any new app, classify each part as content/state, an existing
control/component, a parent-owned layout, or an uncovered independent responsibility.
Inspect existing components and spacing tokens before introducing new definitions.
Inspect and reuse suitable registered components/compositions before assembling
new arrangements from layout guidance. Existing layout-oriented components remain
supported defaults; guidance does not deprecate them. Repeated arrangement or
consistent spacing alone does not justify a NEW duplicate component.

Use app-owned layout guidelines for horizontal rows, vertical stacks/lists, grids and
footer action rows. Present these recipes under Layouts & patterns → Layouts, not in the
component catalog. A recipe documents a default arrangement and tokenized spacing
parameters; it is not a registered control and has no child interaction state gallery.
Do not invent component entries merely to make layout guidance appear in the studio.
If the installed studio cannot present recipes yet, document them in the app's
layout guidance and report the presentation gap rather than inventing schema.

For each recipe, record defaults using the app's existing spacing tokens, supported
parameter choices and a representative preview composed of unchanged components.
Do not import the sandbox's spacing scale into an app. Typical parameters are:

- Horizontal row: gap, alignment and wrapping.
- Vertical stack/list: gap, alignment and outer padding.
- Grid: row/column gaps, column sizing and responsive arrangement.
- Footer action row: gap, alignment and distribution.

The parent may select documented spacing tokens for these parameters. Changing a
layout parameter is configuration, not a new component variant. Keep defaults small
and evidence-based; use app semantic spacing roles where established, otherwise its
spacing primitives. Do not create a separate token or density variant for every
combination. These are guidelines to follow through existing screen layout code, not required
classes, imports or runtime utilities. Consolidate list/grid arrangements in a
switchable guide rather than registering each as a separate component. Shared CSS
utilities are optional only when repetition independently justifies them.

Layout parameters own space between children, outer padding and available space
within each child's documented sizing contract. They must not alter child hit areas,
icon sizes, typography, internal padding, colors or state treatment. A List item owns
its own internal geometry; the containing list owns gaps between items. Avoid double
spacing from simultaneous child margins and parent gaps.

Existing registered action groups and app grids are valid reuse candidates: consult
them first and use them unchanged when suitable. Layout guidelines are a fallback
for uncovered parent-owned arrangements, not a reason to rebuild or deregister an
existing component. For new registration decisions, inspect the independent contract
beyond generic arrangement; behavior is not the only possible justification. Do not
retire or migrate existing registrations merely because they are layout-oriented.
Follow explicit user direction for any such change.

## Required component audit

Before adding or changing a component/composition, load the attached content's
component checklist when provided by its AGENTS.md or USAGE.md. Audit every supported
variant's internal padding, gaps and margins against actual CSS and rendered selectors;
verify the inspector supports those properties and measurements. Include nested
component spacing and use shared renderers, never specimen-only copies. Separate
parent-owned spacing and layout geometry from component spacing. Check optional/long
content, resizing, accessibility and callbacks; record evidence and remaining
verification limits in the app's decisions/. Catalog validation alone is insufficient.
Apply this on first extraction and every later component change, including changes
made while building a new screen. Follow the app's established presentation rules.
This audit is part of authorized implementation work, not a separate approval gate.

## Interaction ownership — required before registration

See [Interaction ownership — required before registration](COMPONENT-REGISTRATION.md#interaction-ownership--required-before-registration) in the mandatory registration contract.

## First extraction

1. Inventory supplied screens: routes, files, assets, viewports, typography, color,
   spacing, repeated controls, layout relationships, states and interactions. Separate
   layout recipes from controls and independently responsible components.
2. Write `decisions/initial-extraction.md` in the content folder: evidence, proposed tokens and
   reusable contracts, discrepancies, confidence, unknown behavior and scope.
3. Infer a concise spacing/type/color system from repeated evidence. Separate raw
   scales, semantic roles and component controls. Preserve intentional exceptions.
4. Build the smallest useful shared implementations. Components include structure,
   optional content, states, accessibility, behavior and resizing, not just styles.
5. Register each component/composition with stable ID/class, source files, real
   specimen URL, states and anatomy. Register patterns, icons and visualizations
   when evidence supports them. All catalog entries need a working example.
6. Update the selected screens in place so they consume those implementations.
   Remove conflicting local rules; adding DS classes alone is not adoption.
7. Check wide/narrow, long/empty/optional content, theme changes, keyboard use and
   active interactions. Use the workbench and inspector to verify ownership.
8. Run validate and tests. Record remaining gaps and what was visually tested.

## Ongoing enrichment

For each new screen, shop the current catalog first. Extend a component when the
contract is genuinely shared; add an explicit variant for a coherent difference;
keep one-off arrangement page-owned. Equal pixels alone do not establish a shared
role. A main page heading and a section heading can need different spacing contracts.

Every shared change updates its contract, token mappings and real previews in the
same task. Definitions should propagate through actual imports. Do not clone a
component's HTML/JS into the workbench if it has a shared renderer.

Internal spacing belongs to the component/composition; parents own external gaps.
Prefer one owner per relationship and avoid doubled margin + gap. Use component
tokens for deliberate scope. Be explicit that a custom property declared on a
component overrides inherited root/theme values.

## Applying copied inspector changes

Treat the copied owner as evidence, not proof. Verify the current declaration and
cascade. A local owner with a common token name is still local. Preserve other
overrides and themes. If the source no longer matches the copied context, inspect
before editing; never silently broaden the scope. Test Reset and scope behavior
when changing the inspector itself.

## Studio updates and framework development

Never synchronize the upstream repository over the content folder or app root.
Use `node studio.js update --config <app-config> --check` in the studio checkout,
then the checked update command when the user authorizes updating. Shared instructions
are read through the loader on each task; do not copy their body into app instructions.
Application schema changes require explicit migrations, never silent rewrites.

For framework development, develop against the sandbox. Keep project catalog v1 compatibility or bump the
contract version and provide migration instructions. Update tests and CHANGELOG.
Only a deliberate release step updates framework.lock.json. Downstream consumers
must never regenerate that lock to conceal local framework modifications.

## Done means

Working imports, registered real specimens, verified source ownership, preserved
behavior, proportionate validation and an honest handoff. A populated registry,
static class count or successful syntax check alone does not establish visual quality.

## Mandatory: distinguish state ownership from component boundaries

See [distinguish state ownership from component boundaries](COMPONENT-REGISTRATION.md#mandatory-distinguish-state-ownership-from-component-boundaries) in the mandatory registration contract.

## Standard: interaction ownership and registration

See [Standard: interaction ownership and registration](COMPONENT-REGISTRATION.md#standard-interaction-ownership-and-registration) in the mandatory registration contract.

## Required preview coverage

See [Required preview coverage](COMPONENT-REGISTRATION.md#required-preview-coverage) in the mandatory registration contract.

## Required specimen presentation contract

See [Required specimen presentation contract](COMPONENT-REGISTRATION.md#required-specimen-presentation-contract) in the mandatory registration contract.

## Mandatory: state categories and preview contracts

See [state categories and preview contracts](COMPONENT-REGISTRATION.md#mandatory-state-categories-and-preview-contracts) in the mandatory registration contract.
