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

The overview ledger describes registered blocks, not measured adoption. Current
counts use the app’s registry; icon tallies count providers, not inferred glyphs.
Missing adoption measurements are explicit. No Titan-specific audit totals appear.
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
