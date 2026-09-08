# Build and grow the project design system

Read README.md, project/BRIEF.md, framework/CONTRACTS.md and the current project
registry before implementing. This file governs this starter; Titan's archived
CLAUDE/DESIGN-SYSTEM instructions in reference/ are historical guidance, not a
requirement to make every project look like Titan.

## Authority and ownership

- A request to build a DS from supplied screens authorizes project token, component,
  registry, specimen and screen changes needed to deliver it.
- `project/` is the app's source of truth. Keep framework development in `framework/`
  only when the task actually asks to improve tooling.
- Never modify shared tool files merely to customize project appearance.
- Do not silently import sandbox tokens, brand colors or CRM semantics as defaults.
- Preserve original screens in inbox/. Make migration copies in screens/.
- Use fictional data for examples. Do not submit real app operations during testing.

## First extraction

1. Inventory supplied screens: routes, files, assets, viewports, typography, color,
   spacing, repeated controls, layout relationships, states and interactions.
2. Write `project/decisions/initial-extraction.md`: evidence, proposed tokens and
   reusable contracts, discrepancies, confidence, unknown behavior and scope.
3. Infer a concise spacing/type/color system from repeated evidence. Separate raw
   scales, semantic roles and component controls. Preserve intentional exceptions.
4. Build the smallest useful shared implementations. Components include structure,
   optional content, states, accessibility, behavior and resizing, not just styles.
5. Register each component/composition with stable ID/class, source files, real
   specimen URL, states and anatomy. Register patterns, icons and visualizations
   when evidence supports them. All catalog entries need a working example.
6. Migrate the supplied screens so they actually consume those implementations.
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

## Framework changes and releases

Develop against the sandbox. Keep project catalog v1 compatibility or bump the
contract version and provide migration instructions. Update tests and CHANGELOG.
Only a deliberate release step updates framework.lock.json. Downstream consumers
must never regenerate that lock to conceal local framework modifications.

## Done means

Working imports, registered real specimens, verified source ownership, preserved
behavior, proportionate validation and an honest handoff. A populated registry,
static class count or successful syntax check alone does not establish visual quality.
