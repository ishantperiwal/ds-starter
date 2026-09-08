# A reusable framework for app design systems

## Intent and status

This document records the intention to extract the design-system infrastructure built
for Titan CRM into a reusable starting point for other apps. It is an extraction brief,
not a claim that a portable package already exists or authorization to migrate the app.

The reusable asset is the way design decisions are defined, implemented, documented,
previewed, inspected and maintained. Titan CRM is the first consumer. Its visual style,
business objects and component catalog do not need to become defaults for other apps.

The current implementation is HTML, CSS and JavaScript. It can seed web apps and web-based
desktop apps. Native implementations can reuse the concepts and metadata contracts, but
need platform-specific controls, previews and inspection adapters.

## What a component is

A component is a reusable implementation of a UI contract. Tokenized values define much
of its appearance, but the contract also includes structure, accepted data, optional parts,
variants, states, behavior, accessibility and resizing rules.

Calling it a snapshot of tokens captures a specimen's appearance, but misses these other
responsibilities. A specimen is a snapshot or example; the component is the implementation
that can produce many valid examples. An input needs labels, keyboard/focus behavior and
validation states as well as padding and typography. A record card needs a content contract
and interaction hooks as well as its surface styling.

The particular CRM components are replaceable. Components themselves remain essential:
they are how foundations become consistent working UI. Text styles are foundations;
labels and text fields implement semantic roles; icons are reusable symbols; logos are
usually brand assets. These should not all be forced into the same abstraction.

## Layers and ownership

| Layer | Defines | Example |
|---|---|---|
| Primitive tokens | The available scales and raw values | `--space-300: 24px` |
| Semantic roles | What a value means | Section separation, secondary text |
| Component controls | Public adjustment points for a UI unit | Card padding, input height |
| Compositions | Reusable arrangements of content | Stack, row, labelled field, structured card |
| Components | Rendered structure, visuals and behavior | Button, menu, record card |
| Patterns | Task and screen-level contracts | Full-page settings, two-pane editor |
| App consumers | Data, routes and feature-specific decisions | A CRM pipeline settings screen |

Internal spacing belongs to the component or composition. Spacing between components
belongs to their parent. Defaults should propagate; intentional local overrides should be
visible and explainable. Prefer existing controls and scales over a new variable for every
instance or edge. Equal pixel values do not necessarily mean equal semantic roles.

For example, a section stack defaults through
`--stack-section-gap → --layout-section-gap → --space-300 → 24px`.
An instance can select another scale token without changing the shared scale itself.
The framework should expose that distinction clearly when inspecting and copying context.

## Workbench tabs

These are the current eight tab roles, retained as the proposed portable organization.
Catalog contents and implementation providers should be configurable per app.

| Tab | Purpose and contents | Source of truth |
|---|---|---|
| Overview | What exists, what is adopted, known gaps and implementation coverage | Registry and inventory reports; counts are advisory |
| Foundations | Color, typography, spacing, radius, elevation, semantic roles, defaults and ownership examples | Token definitions and documented role mappings |
| Icons | Discoverable symbols, names/aliases, supported weights, sizes and usage conventions | Icon provider and its metadata |
| Components | Visual specimens of controls and compositions, variants, states, anatomy and guidance | Registered implementations and contracts |
| Patterns | Screen/task structure, routing, optional regions, accessibility, responsive behavior and contextual examples | Pattern contracts plus app-specific examples |
| Data visualization | Chart types, suitable uses, reading hierarchy, axes, legends, palettes and states | Visualization contracts and renderer adapters |
| Directions | Compare alternative themes against the same specimens | Theme overrides; a direction does not silently change the base |
| Moodboard | References, images, notes, provenance and visual exploration for human/LLM discussion | Persistent reference storage; inspiration is not an approved contract |

Visuals lead; names and detailed guidance follow. Source metadata stays available to tools
without making code the primary designer interface. Examples should teach a named relationship
and focus the relevant region rather than presenting an unexplained full screen.

## Registry and code maintenance

The intended connection is:

**Contract → shared implementation → specimen → app usages → inspection context**

Each entry should identify its stable identity, matching selectors or platform equivalent,
source files, public tokens, supported variants/states, anatomy, behavior and example provider.
Registering a name alone does not componentize existing code. Consumers must actually use
the shared implementation, and conflicting local styling must be removed or documented.

Prefer specimens that call the real renderer. Use deterministic fictional data for contextual
examples, with writes disabled. A change to shared source should appear in those examples
without maintaining a second rendering implementation. Illustrative geometry and platform
adapters must be identified honestly when direct reuse is unavailable.

Maintenance should check missing tokens, registry/schema compatibility, broken source links,
variant/state coverage and consumer drift. Visual and interaction checks remain necessary;
inventory counts and inspector matching cannot prove compliance. Shared changes propagate
only to consumers of that implementation, after reload/build as appropriate. New information
may require changes to both the component's data contract and its callers.

## Inspection and the feedback loop

The current CRM uses `?ds=true` to enable Spacing and Components modes; **H** pauses/resumes
the active mode. This is a development/design capability, not a requirement for end users.

- Spacing mode identifies token-backed spacing, literal spacing and unresolved ownership.
  Copy actions provide either token identity or a specific usage context.
- Components mode identifies registered components/compositions and containing hierarchy,
  source links, observed states and local override candidates. Copy actions provide either
  component identity or instance context.
- Context should identify the screen, target, relevant relationship, source and observed
  state. It should help choose global, variant or local scope rather than assume one.
- Inspectors must not alter layout or submit app actions during selection. Unknown cases
  should remain explicit, and inspection must be easy to pause.

The working loop is: inspect a real usage, copy the relevant context, describe the desired
change, determine ownership, edit the appropriate source, verify specimens and consumers,
and update the contract if it changed. This supports incremental extraction: a page-owned
record card can become a registered component when the need is established.

## What to extract, and what to configure

| Reusable infrastructure | App-specific configuration or adapters |
|---|---|
| Registry/schema conventions and validation | Component/pattern catalogs and feature vocabulary |
| Token organization and ownership rules | Actual scales, themes, fonts and branding |
| Workbench navigation and specimen host | Renderers, sample data and supported states |
| Inspection UI and context-copy format | DOM/platform matching and source resolution |
| Moodboard interaction and reference format | Storage, assets and deployment integration |
| Human/LLM contribution workflow | Routes, build commands, checks and ownership boundaries |

Remove assumptions about CRM routes, Titan selectors, data schemas, a fixed port and local
filesystem locations from the portable core. Keep them in the CRM adapter. Existing local
run policies remain applicable until extraction changes them explicitly.

## Current limits and proposed extraction sequence

The system is useful today, but is not yet an independently packaged framework. Some
specimens are illustrative, some product UI remains page-owned, and the inspectors use
conservative heuristics. Component override candidates are not verified cascade winners.
Chart types cannot be inferred reliably from a generic renderer shell. Native inspection
is not provided by the current DOM-based implementation.

1. Inventory the reusable infrastructure and CRM dependencies; define adapter boundaries.
2. Separate configuration/providers from the workbench, registry and inspection UI.
3. Establish versioned contracts and checks for references, tokens and example compatibility.
4. Create a minimal second-app example with its own theme, components, routes and fixtures.
5. Verify that both apps receive framework improvements without copying infrastructure or
   forcing identical product design. Document extension and upgrade procedures.

Success means another app can adopt the documentation, workbench, inspection and maintenance
workflow while defining its own design language. It does not mean every app must use the
CRM's controls, spacing choices or page patterns.

## Existing implementation references

- [Design-system guidance](design-system/DESIGN-SYSTEM.md): current contracts and LLM workflow.
- [Registry](design-system/registry.json) and [schema](design-system/registry.schema.json).
- [Workbench](design-system/index.html) and [inspector](design-system/spacing-inspector.js).
- [Token entry point](design-system/tokens.css) and [component entry point](design-system/components.css).
- [Moodboard documentation](moodboard/README.md): reference handling and storage; check
  [current run instructions](run%20crm.md) for the integrated CRM startup policy.

This brief describes future extraction. Current design-system guidance remains the authority
for implementing CRM changes; it should not be silently replaced by speculative framework rules.
