# Portable contracts, version 1

The catalog is JSON at `/design-system/registry.json`. Workbench UI consumes
metadata rather than hardcoded component lists. `catalog.schema.json` describes
the portable envelope; `registry.schema.json` is the original, richer Titan schema
kept for reference. They are distinct contracts.

Every component/composition supplies:

- `id`: stable catalog identity; unique across catalog collections.
- `name`, `class`, `css`: public name, root CSS class and implementation source.
- `preview`: same-origin HTML fixture URL relative to the registry directory.
- `states`: supported states, including absent/optional parts where relevant.
- `anatomy.parts`: named selectors.
- `anatomy.spacing`: label, token, selector and CSS property for each relationship.
- `anatomy.ownership` and `behavior`: external/internal spacing and resizing rules.
- Optional `module`, `props`, `variants`, `shapeTokens`, `usage`, accessibility notes.

Example (create the referenced files before registering it):

```json
{
  "id": "note",
  "name": "Note",
  "class": "ds-note",
  "css": "components/note.css",
  "preview": "specimens/note.html",
  "states": ["default", "without metadata"],
  "anatomy": {
    "parts": [{"name":"Body", "selector":".ds-note__body"}],
    "spacing": [{"label":"Inset", "token":"--note-pad", "selector":".ds-note", "property":"padding-left"}],
    "ownership": "Note owns its inset; parent owns external spacing.",
    "behavior": "Fluid width, wrapping text and optional metadata."
  }
}
```

Source URLs are relative to the served registry URL, not the disk directory.
For new attachments, `specimens/note.html` maps to the app content folder and
`../app/any/folder/screen.html` maps to the existing appRoot without copying files.
Token/theme files remain inside the content folder. Cross-profile URLs are rejected.
Legacy `../screens/example.html` continues to work only with legacy configurations.
Static fixture HTML should import the real component CSS/renderer. Include the
inspector script for the Inspect example link to work. Theme-aware fixtures read
their `theme` query parameter and select an approved theme from the catalog;
never interpolate arbitrary user text into stylesheet URLs.

Patterns, visualizations, screens and icon providers require id/name/preview.
Pattern entries should additionally describe structure, routing, focus/keyboard
behavior, scroll ownership, responsive fallback and optional regions. A preview
does not replace those requirements. Native dialog is suitable for bounded mock
tasks; screen-specific widths stay with the adopter.

Icon catalogs use a preview/provider rather than assuming a library. The sandbox
demonstrates dsIcon, names, weights and copying calls. Projects can register another
provider or symbols from their own licensed assets without editing the workbench.

Visualizations register renderer-backed previews. Data, labels and accessible
summaries belong to the fixture/app; chart geometry and language belong to the renderer.
The original reference includes seven contracts; the portable sandbox demonstrates
the five shared renderer implementations. The other two remain reference geometry.

`tokenFiles` lists CSS sources to index. `themes` supplies id/name/file and optional
description. Theme files redefine semantic controls only. The workbench uses
separate frames for direction comparisons so styles cannot bleed between themes.

The anatomy module exposes `wbAnatomy.mount(host, entry, bodySelector)`; hosts have
`.wb-spec-head` and a specimen body. See framework/examples/screens/specimen.js.
No saved app actions are required to inspect specimens.

## App attachment and software ownership

New initialization creates an app-owned studio.config.json with configVersion: 1,
contractVersion: 1, content, appRoot, studioRoot, name, defaultProfile and port.
All filesystem paths are relative to that configuration file. content and the
studio checkout must be disjoint, including after resolving symlinked ancestors.
appRoot is an existing directory and is not relocated. The studio may be nested in
appRoot, but app content must not contain the studio or the existing screen root.

The server, validator and checked updater use this same attachment contract.
Startup refuses a different linked studio or incompatible registry/config version.
The checked Git updater refuses incompatible upstream content contracts before
changing installed files. Schema migration is a separate, explicitly approved task.

Shared agent workflow is framework/AGENT-WORKFLOW.md. App AGENTS.md is only a loader
plus app-specific guidance. Do not copy the shared workflow into app content or
synchronize upstream templates over initialized content on updates.

## Shared workbench presentation

framework/workbench/presentation.css owns the studio’s visual tokens; studio.css
owns its layout and display rules. Do not import app token/component/theme sheets
into the shell. Registered preview URLs render actual app implementations in
separate frames. Preview-theme controls and Directions affect those frames only.

The overview shows catalog totals and registered screen previews, without an
adoption sheet or adoption statistic. Current counts use the app’s registry;
icon tallies count providers, not inferred glyphs.
Component and pattern contracts are rendered from existing v1 metadata; this UI
update does not add a schema requirement or rewrite app-owned registry files.

The foundation index records declared values, source and selector/conditional
scope. Visual samples resolve simple unconditional :root/html aliases only.
Conditional/local declarations and alias cycles are not guessed as computed values.

## Current inspector boundaries

Spacing recognition currently expects token CSS under a URL containing
`/design-system/`. Registry URL and workbench URL are configurable. Framework
releases should preserve these adapter defaults or provide a migration.

Owner identity is declaration-based, including theme/local overrides; equal values
must not group unrelated roles. Root token aliases resolve where they are declared,
so setting an inherited upstream role on a descendant does not necessarily recompute
every alias. Unknown cascade cases must remain explicit rather than guessed.

Previews are document-local CSSOM edits. They reset on reload and are persisted only
through a copied prompt/source edit. Counts are visible highlighted elements, not a
whole-app dependency report. A shared token change can affect offscreen/hidden uses
and consumers on other routes after source changes are applied.

## Optional foundation presentation

Catalog v1 may include foundationPresentation.tokens, keyed by token name. Optional
label, sample, kind (family/weight/leading/size), weight, lineHeight and status fields
customize the foundation specimens only. Tokens and screen CSS remain authoritative.
These fields do not create typography/component contracts or assert adoption.
The workbench keeps source/value/scope metadata under closed Details. Referenced
base values remain under More values; they are not removed from the catalog.

Foundation token presentation metadata may include `layer: "primitive"` or
`layer: "semantic"`. Foundations shows primitive and unclassified entries; semantic
entries remain available in token sources and resolution without appearing there.

`foundationPresentation.textStyles` optionally defines draft typography recipes.
Each entry supplies `id`, `name`, `sample` and token references in `family`, `size`,
`weight`, and optionally `leading`. The relationship view resolves these references
without adopting the draft styles into app components. Missing properties are left
at the preview default rather than implying an established token assignment.

`foundationPresentation.colorRoles` optionally supplies existing semantic `token`,
`label`, `kind` (text, link, surface, color), and `background` for text/link examples.
Connections follow simple aliases to primitives. Contrast is calculated for the
explicit opaque hex foreground/background pair, not the entire product or theme.

`foundationPresentation.spacingRoles` optionally lists existing `token`, `primitive`,
`label`, and `kind` (`gap`, `inline`, `block`). Diagrams use resolved role values
for actual gap or inset dimensions; these examples do not establish generic roles.

Spacing roles may specify `preview` as `text-stack`, `icon-label`, `actions` or
`inline-text`, and `kind: "stack"` for a vertical text gap. An optional `textGap`
token references incidental text spacing inside inset examples. Missing text-gap
metadata adds no arbitrary gap. Preview geometry does not imply app adoption.

`foundationPresentation.elevationRoles` optionally lists existing semantic
elevation `token`, `label`, `kind` (`box-shadow` or `drop-shadow`) and optional
`description`. The Foundations → Elevation panel renders the resolved value on a
neutral surface; it does not infer a numeric scale or promote unlisted shadows.
Optional `border` references a border shorthand token, rendered together with the
role shadow. Primitive samples remain shadow-only.
Optional `primitive` references the underlying shadow recipe token. When supplied,
the view shows selectable primitives and roles with their shared relationship links.
Legacy roles without primitives remain visible.
Optional `placement` (`right` or `bottom`) anchors the sample to a docking edge;
omission centers it. Labels and token names remain visible. Elevation uses one sample per level,
compact role mappings, and distinct unnumbered treatment previews. Raw values and
source notes remain in token files and catalog metadata rather than disclosures.

Components may supply numeric `previewHeight`; the workbench bounds it to 160–800px.
Omitting it retains the default preview height.

The component gallery appends `gallery=1` to preview URLs. Specimens may use this
mode to show a single compact representative example; normal previews retain their
full states and interactions. The gallery opens full previews/contracts on selection.

Component categories are catalog-driven filters with an All view. Gallery previews
may show every supported variant; auto-height specimens keep detail frames fitted
to content. Gallery cards stretch to equal heights within each category grid.

Component details mount framework/anatomy.js inside the same-origin specimen frame.
Preview / Spacing uses registry selectors and computed geometry; selecting a band
reveals its token and measured value. This is inspection only, with no saved edits.
The default specimen root selector is the registered component class. Gallery frames
remain untouched. Detail specimens should provide a main element for this adapter.

Optional component galleryWidth specifies a preferred card width in CSS pixels
(default 360, bounded 280–960). Cards wrap and shrink to available space, never grow
to fill a category. This is presentation metadata, not a component width constraint.
Specimens own representative inner layout widths in both gallery and detail views.

Optional interactions metadata enables the component's Interactions sidebar:
`{preview, targets:[{id,name,states:[]}]}`. The preview is a same-origin URL resolved
like component previews; the sidebar supplies `target` and `state` query parameters.
`live` permits normal interaction. Other states are held by the app specimen using
its actual implementation. Targets expose supported variants and meaningful supported configurations; a target
is not automatically an API variant. Their state lists describe whole-control states. Independently
interactive sections use registered child owners, not private per-section targets. This metadata does not create product states or behavior.

## Interaction ownership metadata

`anatomy.interactionOwnership` records parent and registered interactive-child ownership, plus noninteractive
internal parts. Legacy private interactive targets remain readable for migration,
but are not the accepted structure for new registrations.
Optional `dependencies` lists actual reused catalog component IDs. Interaction
targets may include `owner`; when supplied it must identify the current entry for
that entry’s state list. Nested child states belong in the child's catalog entry.
Legacy entries without `owner` remain supported; new registrations should supply it.

Optional `anatomy.geometry` entries describe derived layout space: `selector`,
`container`, `axis` (vertical/horizontal/both), `label`, and a related sizing `token`.
`kind: "fluid"` outlines the flexible element allocation instead. Geometry is
measured from rendered rectangles, not represented as additional CSS margins.

## Component inspection

Component preview controls include Preview, Spacing and Component. Component mode
inspects real same-origin specimen elements without executing their click actions.
Catalog class matches identify registered components; other nodes are labeled as basic structural elements; they do not require separate
component registration. References contain the selected selector, ancestry,
nearest registered owner and its source files, and the preview URL. Layout nodes
outside a registered root are reported as specimen layout, not component-owned.
Control-click cycles ancestors; the hierarchy and Cycle layer button provide an
alternative. Closing the inspector returns to Preview. No catalog schema change.

Inspector names distinguish Component, Basic element and Layout container. Generic
wrappers appear under Show layout layers, while cycling still reaches every layer.
Renderers may set data-inspector-variant on registered roots to provide an explicit
variant name; the inspector does not guess variants from arbitrary class names.

Inspection stops at the outermost registered component instance in a specimen.
Captions, mount wrappers and variant grids outside that boundary are excluded from
hover, selection and ancestor cycling. Layout layers inside the component remain
inspectable. Full selectors may still include specimen ancestors to identify a
specific rendered instance unambiguously.

## Search metadata

Entries may supply `searchTags: ["alias", "related task"]`. These search-only
keywords never appear as labels. Existing entries need no migration. Search stays
within the current tab/category, normalizes case, accents and punctuation, and
ranks phrases before all-word matches, then fewer-word matches. Partial words
are supported; semantic search and typo correction are not. Input waits 120ms.
Results rank within groups; clearing restores catalog order. Icon providers can
reuse StudioModel.searchMetadata/searchScore from /framework/workbench/model.js.

Search tags are editable in component details and pattern Search tags sections.
StudioTagEditor.mount(host, entry, collection, onSave) supports provider sidebars.
Saving POSTs to /api/search-tags and updates only the selected entry's searchTags
in the attached catalog; icon-assets targets icons/catalog.json. The endpoint
requires same-origin localhost requests, validates limits, deduplicates tags and
replaces the catalog atomically.

Group headings expose copy-reference buttons via StudioGroupReference. Component
and icon group references enumerate all member IDs, including filtered-out items,
so the reference remains stable while searching. Foundation headings reference the
section and available token IDs. Copy feedback is visible beside the heading.

## Text-part typography provenance

The full-page inspector reports typography per visible descendant with direct text,
plus editable fields. Catalog anatomy names identify parts where available; nested
registered controls retain their owning component name. No-text selections have no
text verdict. Container geometry is reported separately.

`typography-trace.js` follows inherited author declarations, inline styles,
importance and simple selector specificity. It expands font shorthands in detached
CSS declarations and attributes a token only to the longhand it affects. Statuses
are Tokenized, Literal, Browser default and Unable to trace, with inherited origin
and source details. This is provenance, not a visual-quality or component-wide
compliance score. Literal fallbacks do not count as tokenization.

Inaccessible stylesheets, unsupported selector specificity/layers/scopes, rollback,
active animation/transition, unknown custom properties and ambiguous native-control
inheritance remain explicitly uncertain. Generated pseudo-element text, shadow-root
stylesheets and user-origin styles are not comprehensively traced. Do not claim
universal CSS coverage. The existing spacing-edit trace remains separate.

Optional `foundationPresentation.elevationLevels` lists ordered `token`, `border`,
`primitive`, `label`, and `class` entries. Elevation roles may reference one through
`level`. The relationship view links levels to roles; specialized unnumbered roles
retain their primitive entries. Older catalogs without levels keep their view.

Catalogs with elevationLevels receive an isometric sidebar navigator. Each layer
scrolls to and selects its matching level without changing the catalog route.
At narrow widths it precedes the level map. It uses the existing level metadata
and adds no schema requirement.


## Component canvas navigation

The Components catalog presents cards on an unbounded pan surface. Drag or scroll
pans; Ctrl/Command-scroll and zoom buttons zoom around the pointer or viewport
center. The keyboard-focusable canvas supports arrow-key panning and +/- zoom.
Search and category filters repack visible cards; Fit All frames the current result.

Selecting a card opens a vertically scrolling context with unchanged specimen
renderers and direct registered dependencies below it. Selecting a child extends
ancestry; revisiting an ancestor truncates it, so cycles do not recurse infinitely.
Missing dependency IDs appear as unavailable, never inferred components. Back to
All restores the current canvas transform. Existing component hash URLs open the
focused view directly. Interaction and inspection tools retain their existing
contracts; narrower windows place the interaction panel below the explorer.
No catalog migration or app-content edits are required.

### Component preview navigation

The interaction sidebar must retain an interactive Live preview of the selected
variant above its state previews. Layout changes must not remove this preview.
Variant chips above Contract & Anatomy select and focus their preview tile;
opening a component focuses its first variant. Recenter fits all variants.

Main component variant previews must be interactive in Preview mode. Variant
selection uses names, chips and tile borders; do not place an input-blocking
overlay over the live component. Switching Preview, Component and Spacing modes
must preserve the same rendered instance and its current interaction state,
including expanded content, without reloading the iframe or remounting the sample.
Inspection may intercept input while enabled; returning to Preview restores normal
interaction. Expanded/collapsed remain states, not variants created for inspection.

## Layout recipe classification

Layout recipes belong in Layouts & patterns → Layouts conceptually, not in `components`
or `compositions` solely because they standardize arrangement. Their defaults and
spacing-token choices are app-owned; generic studio tooling must not hardcode one
app's values. Follow AGENT-WORKFLOW.md's layout recipe rule when extracting
new apps. Recipe configuration controls parent-owned layout only and does not create
child variants or permit internal overrides.

This policy does not add a catalog v1 schema field or claim a Layout editor exists.
Implementing recipe storage and studio presentation requires an explicit compatible
contract and validation coverage; until supported, keep recipes in app guidance.

Layout guidance may consolidate list and grid arrangements into one switchable
preview. It documents supported scales and relationships, not mandatory application
CSS utilities. Existing pattern entries can host this guide without a new schema.

### Inspector variant labels

Page and specimen inspectors display `Component name · Variant name` when a
registered configuration can be identified. A renderer may set
`data-inspector-variant` to its own interaction target ID or registered name.
Alternatively, a target may declare `inspectorSelector`: a CSS selector matching
that component's element in the actual rendered page, not a specimen-only wrapper.
Exactly one matching target is required. CSS modifier classes alone never establish configuration identity. Child-owned targets are excluded. Missing,
unknown or ambiguous identity displays only the component name; never infer a
variant from text content, current interaction state, or the first catalog target.

### One canonical component preview source

`entry.preview` is the source for both the outside canvas card and the main
variant canvas in its expanded modal. `interactions.preview` belongs exclusively
to the right-hand interaction card; never use it to rebuild the main variant gallery.

Optional `previewConfigurations` lists `{id, name, selector, interactionTarget}`.
Each selector identifies exactly one example in `entry.preview` within `main`.
It selects existing rendered content, never a second renderer, fixture or URL.
The modal hides other example branches while retaining original nodes, ancestors
and event handlers. An absent list displays the entire canonical source as one
Default preview; it must not silently substitute interaction targets. The optional
interactionTarget connects selection to the separate right-hand state controls.

A multi-example source must enumerate its configurations. Validate selector matches
in the actual browser, keep names/order aligned with the outside gallery, and verify
content and child components agree in both views. CSS sizing, centering and zoom are
presentation differences; columns, data, assets and mounted children are shared.

The modal must preserve each gallery example's measured content width, independently
of the surrounding modal tile width and canvas zoom. Reuse the outside specimen
wrapper's layout dimensions; do not stretch every example to the largest variant.
Keep live content height free to respond to interactions. Measure unscaled iframe
layout pixels and never override component-owned CSS to match preview dimensions.

### Explicit preview arrangement

Optional `previewLayout.columns` is a positive column count for the expanded variant
canvas. Omitted values retain automatic layout. App gallery adapters may consume
the same metadata and `previewConfigurations` order for consistent comparisons.
This changes specimen arrangement only, never component internals or state ownership.

Themes may declare `colorScheme: "light" | "dark"` to set the preview framing
scheme. Foundations offers the registered themes and persists selection per
catalog. The selected theme's root tokens override matching base root tokens in
the foundation index; scoped declarations remain contextual. Theme selection is
passed to every preview URL. App fixtures own loading their approved theme file.
