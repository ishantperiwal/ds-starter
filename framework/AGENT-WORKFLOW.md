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
- Internal parts of a single control (split-button segments, tabs, integrated filter
  triggers) may have independent targets when that control owns their behavior.
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
   spacing, repeated controls, layout relationships, states and interactions.
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
