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

For every component, classify each interaction as owned behavior, an internal part,
a nested registered component, or caller-owned behavior. Inspect actual imports and
renderers; visual similarity is not proof of reuse. Record this in
`anatomy.interactionOwnership` and list actual nested component IDs in `dependencies`.

- Reuse registered child renderers. A parent may compose components without owning
  their hover, focus, pressed or disabled state demonstrations.
- Show only owner-level states in the parent's Interactions sidebar. For example,
  a message may demonstrate expansion; its nested reply Button states belong in Button.
- Keep nested controls usable in Live, but do not repeat whole parent specimens
  merely to demonstrate a child's state. Reference that dependency in metadata.
- Independently interactive sections require registered component instances. Parent
  state targets must not substitute for child registration. Reuse existing controls;
  repeated instances do not require new IDs. Composition-only variants may declare
  required preview/usage context. Noninteractive internal parts remain internal.
- Distinguish variants from dependencies and from grouped layout examples. A group
  does not introduce a new button state. Do not infer states from generic conventions.
- Annotate interaction targets with `owner` equal to the owning catalog ID. If a
  target belongs to another registered component, document it there instead.
- If the parent owns no interactions but reuses registered children, show Live and
  links to child interaction owners. If neither exists, show “No interactions defined.” Do not invent
  states to populate the sidebar. Audit source behavior, not just available CSS.

Apply this on extraction, composition, variant additions and every interaction edit.
Record gaps honestly when child reuse or browser verification is incomplete.

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

For affected stateful controls, identify the owner of the value, the registered
control that renders its accessible semantics and visual treatment, and the owner
of the action/update callback. Caller-owned data can drive UI state; it does not
mean the control has no state. Supplying documented state inputs and handling
documented outputs is unchanged reuse, not permission to override child internals.

State alone does not justify a new component or variant. Reuse a suitable existing
control first. A different label/icon/value is an instance. An approved change to
the same responsibility may be a variant or API extension; an uncovered independent
responsibility may justify a component that composes existing controls. Multiple
consumers are evidence, not a registration prerequisite. Respect app-owned rules
requiring explicit approval for new variants or changes to shared child contracts.

Keep child visual state galleries with their registered owner, while allowing those
states naturally in parent Live previews and checking parent state propagation,
keyboard/disabled behavior and domain callbacks. Do not confuse transient active
interaction with a persistent pressed/toggle value.

### Contextual layout defaults

Choose the enclosing context before selecting a list/grid gap: data rows, dropdown
menus, sidebar navigation, forms/settings, independent cards and app entries may
need different relationships. Record item gap, group gap and surface inset separately
from child internal padding. Source values from the attached app, label observed
versus provisional recommendations, and never generalize a child’s internal padding
into an external layout default. Unknown contexts require an explicit parent-owned
choice and verification, not an invented universal spacing rule.

## Standard: interaction ownership and registration

An interaction unit is a region independently targetable by supported input that
performs a semantic action or has an independently triggered interaction state.
Identify units by user-facing behavior, not DOM boundaries or event-listener count.
Each unit must be implemented by a registered component instance with one control
owner. An enclosing registration does not cover independent descendant units.

A component's own states apply to its unit as a whole; independent descendant
states belong to registered children. Multiple simultaneous state dimensions do
not alone imply multiple units. Noninteractive parts may render their owner's
state without separate registration. Separate ownership of the state value,
control semantics/treatment, and action handling in the contract.

Inventory units, search existing definitions/variants, reuse suitable ones unchanged,
and document uncovered responsibilities before adding definitions or changing shared
contracts. A repeated use is an instance, not a new definition. Composition-only
contracts are valid if required context is explicit and real previews inspect the
unit in that context. Neither standalone product usage nor multiple consumers is
required. Follow applicable approval rules; classification is not blanket permission
for new variants or unrelated migrations.

Validate real renderer calls, dependency metadata, owner-level state previews and
parent integration. Private per-section targets cannot replace child registration.
Examples elsewhere illustrate these requirements and do not override their scope.

## Required preview coverage

Contract classification and inspectable preview coverage are separate. A target is
not automatically an API variant. Expose registered variants plus meaningful supported
configurations affecting structure, geometry, controls, accessibility or usage constraints,
including content presence, discrete sizes and composition positions. Honor explicitly
requested configurations; do not use instance classification to omit them. Representative
content values suffice within each configuration; avoid arbitrary prop Cartesian products.
Map targets to real renderer inputs and keep Live/inspection reachable. States remain
states; unsupported configurations must not be presented as supported.

## Required specimen presentation contract

Document the attached app's gallery presentation and reuse one shared specimen-only
stylesheet/helper instead of copying inline CSS per preview. Studio overview previews
receive `gallery=1`; the adapter sets `body[data-gallery=true]`. Define concise named
configurations, consistent compartment borders/padding, centered specimens and
content-aware column counts. Preserve component dimensions, required context and
interaction instances; gallery styling must not target component internals.

Captions identify configurations, not implementation details or instructions to
authors. Put reuse/ownership/renderer notes in contracts or usage documentation.
Check both compact and wide specimens, standalone behavior and gallery rendering.
