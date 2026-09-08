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

Source URLs must be relative and remain within project/ (or the sandbox root).
`../screens/example.html` is valid for a project registry in design-system/.
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
